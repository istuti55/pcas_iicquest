import datetime
import http.client
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

INFOBIP_BASE_URL = os.getenv("INFOBIP_BASE_URL", "")
API_KEY = os.getenv("INFOBIP_API_KEY", "")
SENDER = os.getenv("INFOBIP_SENDER", "PALO")


def send_sms(phone_number: str, message: str) -> bool:
    if not phone_number:
        return False

    if not API_KEY or not INFOBIP_BASE_URL:
        print("[SMS] WARNING: INFOBIP_API_KEY or INFOBIP_BASE_URL not set in .env — SMS skipped.")
        return False

    clean_phone = ''.join(filter(str.isdigit, phone_number))

    try:
        conn = http.client.HTTPSConnection(INFOBIP_BASE_URL)

        payload = json.dumps({
            "messages": [
                {
                    "from": SENDER,
                    "destinations": [
                        {"to": clean_phone}
                    ],
                    "text": message
                }
            ]
        })

        headers = {
            "Authorization": API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        conn.request("POST", "/sms/2/text/advanced", payload, headers)
        res = conn.getresponse()
        data = res.read().decode("utf-8")

        border = "=" * 50
        print(f"\n{border}")
        print(f"[INFOBIP SMS SENT TO]: {clean_phone}")
        print(f"[TIME]: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"[MESSAGE]: {message}")
        print(f"[STATUS]: {res.status}")
        print(f"[RESPONSE]: {data}")
        print(f"{border}\n")

        return res.status in (200, 201, 202)

    except Exception as e:
        print(f"[ERROR] Failed to send SMS: {e}")
        return False