"""
קובץ זה מטפל בשליחת הודעות SMS באמצעות Twilio במערכת TRIPLE.

פונקציונליות:
- שימוש ב־Twilio Python SDK ליצירת הודעות SMS.
- הגדרת פרטי ההתחברות (SID, TOKEN) נטענת מקובץ .env.
- `TWILIO_PHONE_NUMBER` הוא מספר הטלפון של החשבון (ולא SID של שירות הודעות).

פונקציה מרכזית:
- send_sms(to, body):
    שולחת הודעת טקסט למספר `to` עם תוכן `body` באמצעות חשבון Twilio.

שימוש עיקרי:
- שליחת קמפיינים שיווקיים או עדכונים דרך SMS למשתמשים במערכת.

 הערה:
- יש לוודא שמספר הטלפון (`to`) בפורמט בינלאומי (למשל: +972…).
- ניתן להרחיב את הקובץ לתמיכה ב־Messaging Service SID אם נדרש.
"""

from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

# מה .env
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = '+12154342944'  

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_sms(to, body):
    message = client.messages.create(
        to=to,
        from_=TWILIO_PHONE_NUMBER,  
        body=body
    )
    return message.sid
