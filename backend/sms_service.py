import datetime
import http.client
import json
import os

def send_sms(phone: str, message: str) -> bool:
    """
    Sends an SMS using the Infobip API.
    Ensure INFOBIP_API_KEY, INFOBIP_URL, and INFOBIP_SENDER are set in your environment variables.
    """
    if not phone:
        return False
        
    api_key = os.getenv("INFOBIP_API_KEY", "App 051fb719390d13a99dbb89aecf3afd47-ad1ca139-e7a9-43c4-b4f1-4ccb92b3acd8")
    base_url = os.getenv("INFOBIP_URL", "qwg982.api.infobip.com")
    sender = os.getenv("INFOBIP_SENDER", "447491163443")
    
    # Format phone number (remove any + or spaces if necessary, but Infobip handles standard formats)
    clean_phone = ''.join(filter(str.isdigit, phone))
    
    try:
        conn = http.client.HTTPSConnection(base_url)
        payload = json.dumps({
            "messages": [
                {
                    "destinations": [
                        {
                            "to": clean_phone
                        }
                    ],
                    "sender": sender,
                    "content": {
                        "text": message
                    }
                }
            ]
        })
        
        headers = {
            'Authorization': api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        conn.request("POST", "/sms/3/messages", payload, headers)
        res = conn.getresponse()
        data = res.read()
        
        # Log to terminal
        border = "=" * 50
        print(f"\n{border}")
        print(f"[INFOBIP SMS SENT TO]: {clean_phone}")
        print(f"[TIME]: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"[MESSAGE]:\n{message}")
        print(f"[RESPONSE]: {data.decode('utf-8')}")
        print(f"{border}\n")
        
        return res.status in (200, 201, 202)
        
    except Exception as e:
        print(f"[ERROR] Failed to send SMS via Infobip: {e}")
        return False
