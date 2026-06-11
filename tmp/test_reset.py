import requests
import datetime
from zoneinfo import ZoneInfo

BASE_URL = "http://localhost:8000"
QUEUE_ID = "default-queue"

def test_daily_reset():
    # 1. Use tomorrow's date to test reset to 1
    NPT = ZoneInfo("Asia/Kathmandu")
    tomorrow = (datetime.datetime.now(NPT) + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    
    print(f"Testing daily reset for {tomorrow}...")
    
    res = requests.post(f"{BASE_URL}/queues/{QUEUE_ID}/tokens", json={
        "name": "Tomorrow User",
        "phone": f"990000{datetime.datetime.now().microsecond}",
        "service_date": tomorrow
    })
    
    if res.status_code == 200:
        data = res.json()
        print(f"SUCCESS: Created Token #{data['number']} for {tomorrow}")
        if data['number'] == 1:
            print("VERIFIED: Token number reset to 1 for a new day.")
        else:
            print(f"FAILURE: Token number did not reset to 1, got #{data['number']}")
    else:
        print(f"FAILURE: Unexpected status code {res.status_code}: {res.text}")

if __name__ == "__main__":
    try:
        test_daily_reset()
    except Exception as e:
        print(f"ERROR: {e}")
