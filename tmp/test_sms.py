import sys
import os
sys.path.append(os.getcwd())
from backend.sms_service import send_sms

# Test number (Nepal format with 977)
test_phone = "9779865463131" # Example
res = send_sms(test_phone, "Pālo Test Message with 977")
print(f"Result: {res}")
