import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg['Subject'] = 'בדיקת שליחת מייל'
msg['From'] = 'REEM.20DR@GMAIL.COM'
msg['To'] = 'REEM.20DR@gmail.com'
msg.set_content('זה מייל בדיקה פשוט ממערכת TRIPLE')

try:
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login('REEM.20DR@GMAIL.COM', 'yawi nezk ejsd vllf')
        smtp.send_message(msg)
        print("המייל נשלח בהצלחה ✅")
except Exception as e:
    print("⚠️ שגיאה בשליחה:", e)
