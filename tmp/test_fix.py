import requests
import datetime
from zoneinfo import ZoneInfo

BASE_URL = "http://localhost:8000"
QUEUE_ID = "default-queue"  # Based on lifespan bootstrap

def test_token_creation():
    # 1. Reset daily limit via API (if we could, but let's assume we use the default-queue)
    # Since we can't easily change the limit without auth or knowing the admin PIN (1234), 
    # let's just try creating a token.
    
    NPT = ZoneInfo("Asia/Kathmandu")
    today = datetime.datetime.now(NPT).strftime("%Y-%m-%d")
    
    print(f"Testing token creation for {today}...")
    
    # Try joining
    res = requests.post(f"{BASE_URL}/queues/{QUEUE_ID}/tokens", json={
        "name": "Test User",
        "phone": f"980000{datetime.datetime.now().microsecond}", # Unique phone
        "service_date": today
    })
    
    if res.status_code == 200:
        data = res.json()
        print(f"SUCCESS: Created Token #{data['number']}")
    elif res.status_code == 403:
        if "INVALID" in res.json().get("detail", ""):
            print("SUCCESS: Limit overflow handled with INVALID.")
        else:
            print(f"FAILURE: 403 error but no 'INVALID' in detail: {res.json()}")
    elif res.status_code == 409:
        print(f"INFO: Already have a token: {res.json()['detail']}")
    else:
        print(f"FAILURE: Unexpected status code {res.status_code}: {res.text}")

if __name__ == "__main__":
    try:
        test_token_creation()
    except Exception as e:
        print(f"ERROR: {e}")
