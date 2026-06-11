from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class TokenStateEnum(str, Enum):
    WAITING = "waiting"
    CALLED = "called"
    SERVING = "serving"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


# Organization Schemas
class OrganizationCreate(BaseModel):
    name: str


class OrganizationResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Queue Schemas
class QueueCreate(BaseModel):
    name: str
    description: Optional[str] = None
    daily_limit: Optional[int] = 0


class QueueUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    daily_limit: Optional[int] = None
    active: Optional[int] = None


class QueueResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str]
    daily_limit: int
    active: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class QueueDetailResponse(QueueResponse):
    tokens_count: Optional[int] = None
    waiting_count: Optional[int] = None
    avg_wait_time: Optional[float] = None


class ImpactStatsResponse(BaseModel):
    users_served: int
    hours_saved: int
    wait_reduction_pct: int


# Token Schemas
class TokenCreate(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    service_day: Optional[str] = "today"  # today or tomorrow


class TokenResponse(BaseModel):
    id: str
    queue_id: str
    number: int
    phone: Optional[str]
    email: Optional[str]
    state: TokenStateEnum
    service_date: datetime
    verification_pin: str
    joined_at: datetime
    called_at: Optional[datetime]
    completed_at: Optional[datetime]
    wait_time_minutes: Optional[float]
    estimated_wait_minutes: Optional[float]
    risk_status: Optional[str]
    requires_confirmation: Optional[int]
    is_confirmed: Optional[int]
    reminder_sent: Optional[int]
    
    class Config:
        from_attributes = True


class TokenSecureResponse(TokenResponse):
    secret_token: str


class TokenStateUpdate(BaseModel):
    state: TokenStateEnum


class TokenListResponse(BaseModel):
    tokens: List[TokenResponse]
    total: int
    waiting: int
    serving: int
    completed: int


# Counter Schemas
class CounterCreate(BaseModel):
    number: int
    name: Optional[str] = None
    operator_name: Optional[str] = None


class CounterUpdate(BaseModel):
    name: Optional[str] = None
    operator_name: Optional[str] = None
    status: Optional[str] = None
    current_token_id: Optional[str] = None


class CounterResponse(BaseModel):
    id: str
    queue_id: str
    number: int
    name: Optional[str]
    operator_name: Optional[str]
    current_token_id: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Dashboard Schemas
class QueueStatsResponse(BaseModel):
    queue_id: str
    queue_name: str
    total_waiting: int
    total_serving: int
    total_completed_today: int
    total_issued: int
    avg_wait_time: Optional[float]
    counters_active: int
    counters_total: int


class OperatorQueueResponse(BaseModel):
    queue_id: str
    queue_name: str
    waiting_tokens: List[TokenResponse]
    serving_tokens: List[TokenResponse]
    counters: List[CounterResponse]
    next_token: Optional[TokenResponse] = None


# Health check
class HealthResponse(BaseModel):
    status: str
    database: str
    version: str = "0.1.0"
