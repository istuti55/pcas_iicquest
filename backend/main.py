import fastapi
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from contextlib import asynccontextmanager
from datetime import datetime
import os
import uuid

from database import get_db, init_db
from models import (
    Organization, Queue, Token, Counter, TokenState, TrainingData
)
from schemas import (
    OrganizationCreate, OrganizationResponse,
    QueueCreate, QueueUpdate, QueueResponse, QueueDetailResponse,
    TokenCreate, TokenResponse, TokenSecureResponse, TokenStateUpdate, TokenListResponse,
    CounterCreate, CounterUpdate, CounterResponse,
    QueueStatsResponse, OperatorQueueResponse,
    HealthResponse
)
from ml_engine import ml_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    init_db()
    yield


app = FastAPI(title="Pālo Queue Management API", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health & Status
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health(db: Session = fastapi.Depends(get_db)):
    """Health check endpoint"""
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return HealthResponse(status="ok", database=db_status)


# ============================================================================
# Organizations
# ============================================================================

@app.post("/organizations", response_model=OrganizationResponse)
async def create_organization(
    org: OrganizationCreate,
    db: Session = fastapi.Depends(get_db)
):
    """Create a new organization"""
    db_org = Organization(id=str(uuid.uuid4()), name=org.name)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org


@app.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str, db: Session = fastapi.Depends(get_db)):
    """Get organization by ID"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise fastapi.HTTPException(status_code=404, detail="Organization not found")
    return org


# ============================================================================
# Queues
# ============================================================================

@app.post("/organizations/{org_id}/queues", response_model=QueueResponse)
async def create_queue(
    org_id: str,
    queue: QueueCreate,
    db: Session = fastapi.Depends(get_db)
):
    """Create a new queue"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise fastapi.HTTPException(status_code=404, detail="Organization not found")
    
    db_queue = Queue(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        name=queue.name,
        description=queue.description,
        daily_limit=queue.daily_limit
    )
    db.add(db_queue)
    db.commit()
    db.refresh(db_queue)
    return db_queue


@app.get("/organizations/{org_id}/queues", response_model=list[QueueResponse])
async def list_queues(org_id: str, db: Session = fastapi.Depends(get_db)):
    """List all queues for an organization"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise fastapi.HTTPException(status_code=404, detail="Organization not found")
    
    queues = db.query(Queue).filter(Queue.organization_id == org_id).all()
    return queues


@app.get("/queues/{queue_id}", response_model=QueueResponse)
async def get_queue(queue_id: str, db: Session = fastapi.Depends(get_db)):
    """Get queue by ID"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise fastapi.HTTPException(status_code=404, detail="Queue not found")
    return queue


@app.patch("/queues/{queue_id}", response_model=QueueResponse)
async def update_queue(
    queue_id: str,
    queue_update: QueueUpdate,
    db: Session = fastapi.Depends(get_db)
):
    """Update queue"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise fastapi.HTTPException(status_code=404, detail="Queue not found")
    
    if queue_update.name:
        queue.name = queue_update.name
    if queue_update.description is not None:
        queue.description = queue_update.description
    if queue_update.active is not None:
        queue.active = queue_update.active
    if queue_update.daily_limit is not None:
        queue.daily_limit = queue_update.daily_limit
    
    queue.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(queue)
    return queue


# ============================================================================
# Tokens (Queue Members)
# ============================================================================

@app.post("/queues/{queue_id}/tokens", response_model=TokenSecureResponse)
async def create_token(
    queue_id: str,
    token_data: TokenCreate,
    db: Session = fastapi.Depends(get_db)
):
    """Join a queue and get a token"""
    import random
    import uuid
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise fastapi.HTTPException(status_code=404, detail="Queue not found")
    
    # Rule 1: Daily Limit (checked against service_date)
    # Handle service_day from request
    from datetime import timedelta
    service_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if token_data.service_day == "tomorrow":
        service_date += timedelta(days=1)
    
    if queue.daily_limit > 0:
        tokens_issued_for_date = db.query(Token).filter(
            Token.queue_id == queue_id,
            Token.service_date == service_date
        ).count()
        if tokens_issued_for_date >= queue.daily_limit:
            raise fastapi.HTTPException(
                status_code=403, 
                detail=f"Daily token limit ({queue.daily_limit}) reached for this queue."
            )
            
    # Rule 2: 12-Hour Cooldown for same user (phone)
    if token_data.phone:
        from datetime import timedelta
        cooldown_threshold = datetime.utcnow() - timedelta(hours=12)
        
        recent_token = db.query(Token).filter(
            Token.phone == token_data.phone,
            Token.joined_at >= cooldown_threshold
        ).first()
        
        if recent_token:
            time_passed = datetime.utcnow() - recent_token.joined_at
            hours_passed = time_passed.total_seconds() / 3600
            hours_left = 12 - hours_passed
            raise fastapi.HTTPException(
                status_code=403,
                detail=f"Cooldown active: You already have a token. Please wait another {hours_left:.1f} hours."
            )

    # Get next token number for this service_date
    last_token = db.query(Token).filter(
        Token.queue_id == queue_id,
        Token.service_date == service_date
    ).order_by(Token.number.desc()).first()
    next_number = (last_token.number + 1) if last_token else 101
    
    # Count current waiting tokens for ML input
    waiting_count = db.query(Token).filter(
        Token.queue_id == queue_id,
        Token.state == TokenState.WAITING,
        Token.service_date == service_date
    ).count()
    
    # Create token
    db_token = Token(
        id=str(uuid.uuid4()),
        queue_id=queue_id,
        number=next_number,
        phone=token_data.phone,
        email=token_data.email,
        state=TokenState.WAITING,
        service_date=service_date,
        secret_token=str(uuid.uuid4()),
        verification_pin=str(random.randint(1000, 9999))
    )
    
    # Predict wait time
    now = datetime.utcnow()
    hour = now.hour
    day_of_week = now.weekday()
    estimated_minutes = ml_engine.predict(hour, day_of_week, waiting_count)
    db_token.estimated_wait_minutes = estimated_minutes
    
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    
    return db_token


@app.get("/queues/{queue_id}/tokens", response_model=TokenListResponse)
async def list_tokens(queue_id: str, db: Session = fastapi.Depends(get_db)):
    """List all tokens in a queue"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise fastapi.HTTPException(status_code=404, detail="Queue not found")
    
    tokens = db.query(Token).filter(Token.queue_id == queue_id).all()
    
    waiting = sum(1 for t in tokens if t.state == TokenState.WAITING)
    serving = sum(1 for t in tokens if t.state == TokenState.SERVING)
    completed = sum(1 for t in tokens if t.state == TokenState.COMPLETED)
    
    return TokenListResponse(
        tokens=tokens,
        total=len(tokens),
        waiting=waiting,
        serving=serving,
        completed=completed
    )


@app.get("/tokens/{token_id}", response_model=TokenResponse)
async def get_token(
    token_id: str, 
    db: Session = fastapi.Depends(get_db),
    x_token_secret: Optional[str] = fastapi.Header(None)
):
    """Get token by ID (Masks sensitive data if secret is missing)"""
    token = db.query(Token).filter(Token.id == token_id).first()
    if not token:
        raise fastapi.HTTPException(status_code=404, detail="Token not found")
    
    # Simple masking logic
    if not x_token_secret or x_token_secret != token.secret_token:
        # Mask pin, phone and email for public viewing
        token.verification_pin = "****"
        if token.phone:
            token.phone = token.phone[:3] + "****" + token.phone[-2:] if len(token.phone) > 5 else "***"
        if token.email:
            parts = token.email.split("@")
            token.email = parts[0][:2] + "..." + "@" + parts[1] if len(parts) > 1 else "***"
            
    return token


@app.patch("/tokens/{token_id}", response_model=TokenResponse)
async def update_token_state(
    token_id: str,
    state_update: TokenStateUpdate,
    db: Session = fastapi.Depends(get_db)
):
    """Update token state"""
    token = db.query(Token).filter(Token.id == token_id).first()
    if not token:
        raise fastapi.HTTPException(status_code=404, detail="Token not found")
    
    now = datetime.utcnow()
    
    # State transitions
    old_state = token.state
    token.state = TokenState(state_update.state)
    
    if token.state == TokenState.CALLED and not token.called_at:
        token.called_at = now
    
    if token.state == TokenState.COMPLETED and not token.completed_at:
        token.completed_at = now
        if token.joined_at:
            wait_minutes = (now - token.joined_at).total_seconds() / 60
            token.wait_time_minutes = wait_minutes
            
            # Record training data
            training_record = TrainingData(
                id=str(uuid.uuid4()),
                queue_id=token.queue_id,
                hour_of_day=token.joined_at.hour,
                day_of_week=token.joined_at.weekday(),
                queue_depth=db.query(Token).filter(
                    Token.queue_id == token.queue_id,
                    Token.joined_at <= token.joined_at,
                    Token.state == TokenState.WAITING
                ).count(),
                wait_time_minutes=wait_minutes
            )
            db.add(training_record)
    
    db.commit()
    db.refresh(token)
    return token


# ============================================================================
# Counters
# ============================================================================

@app.post("/queues/{queue_id}/counters", response_model=CounterResponse)
async def create_counter(
    queue_id: str,
    counter: CounterCreate,
    db: Session = fastapi.Depends(get_db)
):
    """Create a counter"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise fastapi.HTTPException(status_code=404, detail="Queue not found")
    
    db_counter = Counter(
        id=str(uuid.uuid4()),
        queue_id=queue_id,
        number=counter.number,
        name=counter.name,
        operator_name=counter.operator_name
    )
    db.add(db_counter)
    db.commit()
    db.refresh(db_counter)
    return db_counter


@app.get("/queues/{queue_id}/counters", response_model=list[CounterResponse])
async def list_counters(queue_id: str, db: Session = fastapi.Depends(get_db)):
    """List all counters for a queue"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise fastapi.HTTPException(status_code=404, detail="Queue not found")
    
    counters = db.query(Counter).filter(Counter.queue_id == queue_id).all()
    return counters


@app.patch("/counters/{counter_id}", response_model=CounterResponse)
async def update_counter(
    counter_id: str,
    counter_update: CounterUpdate,
    db: Session = fastapi.Depends(get_db)
):
    """Update counter"""
    counter = db.query(Counter).filter(Counter.id == counter_id).first()
    if not counter:
        raise fastapi.HTTPException(status_code=404, detail="Counter not found")
    
    if counter_update.name:
        counter.name = counter_update.name
    if counter_update.operator_name:
        counter.operator_name = counter_update.operator_name
    if counter_update.status:
        counter.status = counter_update.status
    if counter_update.current_token_id:
        counter.current_token_id = counter_update.current_token_id
    
    db.commit()
    db.refresh(counter)
    return counter


# ============================================================================
# Dashboard & Analytics
# ============================================================================

@app.get("/queues/{queue_id}/stats", response_model=QueueStatsResponse)
async def get_queue_stats(queue_id: str, db: Session = fastapi.Depends(get_db)):
    """Get queue statistics"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise fastapi.HTTPException(status_code=404, detail="Queue not found")
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    waiting = db.query(Token).filter(
        Token.queue_id == queue_id,
        Token.state == TokenState.WAITING,
        Token.service_date == today
    ).count()
    
    serving = db.query(Token).filter(
        Token.queue_id == queue_id,
        Token.state == TokenState.SERVING,
        Token.service_date == today
    ).count()
    
    completed = db.query(Token).filter(
        Token.queue_id == queue_id,
        Token.state == TokenState.COMPLETED,
        Token.service_date == today
    ).count()
    
    counters = db.query(Counter).filter(Counter.queue_id == queue_id).all()
    active_counters = sum(1 for c in counters if c.status != "idle")
    
    # Calculate average wait time
    completed_tokens = db.query(Token).filter(
        Token.queue_id == queue_id,
        Token.state == TokenState.COMPLETED,
        Token.wait_time_minutes != None
    ).all()
    
    avg_wait = None
    if completed_tokens:
        avg_wait = sum(t.wait_time_minutes for t in completed_tokens) / len(completed_tokens)
    
    return QueueStatsResponse(
        queue_id=queue_id,
        queue_name=queue.name,
        total_waiting=waiting,
        total_serving=serving,
        total_completed_today=completed,
        avg_wait_time=avg_wait,
        counters_active=active_counters,
        counters_total=len(counters)
    )


@app.get("/queues/{queue_id}/operator-view", response_model=OperatorQueueResponse)
async def get_operator_view(queue_id: str, db: Session = fastapi.Depends(get_db)):
    """Get queue data for operator dashboard"""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise fastapi.HTTPException(status_code=404, detail="Queue not found")
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    waiting = db.query(Token).filter(
        Token.queue_id == queue_id,
        Token.state == TokenState.WAITING,
        Token.service_date == today
    ).order_by(Token.joined_at).all()
    
    serving = db.query(Token).filter(
        Token.queue_id == queue_id,
        Token.state == TokenState.SERVING,
        Token.service_date == today
    ).all()
    
    counters = db.query(Counter).filter(Counter.queue_id == queue_id).all()
    
    next_token = waiting[0] if waiting else None
    
    return OperatorQueueResponse(
        queue_id=queue_id,
        queue_name=queue.name,
        waiting_tokens=waiting,
        serving_tokens=serving,
        counters=counters,
        next_token=next_token
    )


@app.post("/ml/train")
async def train_ml_model(db: Session = fastapi.Depends(get_db)):
    """Train ML model on historical data"""
    # Get all training data
    training_records = db.query(TrainingData).all()
    
    if len(training_records) < 10:
        raise fastapi.HTTPException(
            status_code=400,
            detail=f"Not enough training data ({len(training_records)} records). Need at least 10."
        )
    
    training_data = [
        {
            "hour_of_day": t.hour_of_day,
            "day_of_week": t.day_of_week,
            "queue_depth": t.queue_depth,
            "wait_time_minutes": t.wait_time_minutes
        }
        for t in training_records
    ]
    
    success = ml_engine.train(training_data)
    
    if not success:
        raise fastapi.HTTPException(status_code=500, detail="Training failed")
    
    return {
        "status": "success",
        "records_trained": len(training_data),
        "model_info": ml_engine.get_model_info()
    }


@app.get("/ml/model-info")
async def get_model_info():
    """Get ML model information"""
    return ml_engine.get_model_info()
