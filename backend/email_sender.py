from backend.models.models import db, Campaign, User, Contact, ContactGroup
import json
import os
import mimetypes
from pathlib import Path
from flask import current_app
from email.message import EmailMessage
import smtplib

def to_fs_path(p):
    if not p:
        return None
    base_dir = Path(current_app.root_path).parent
    if p.startswith("/"):
        return str(base_dir / p.lstrip("/"))
    if not os.path.isabs(p):
        return str(base_dir / p)
    return p

def send_email_for_campaign(campaign_id):
    print(f"\n📨 Start sending campaign {campaign_id}...\n")

    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        print(" Campaign not found.")
        return {"error": "Campaign not found."}, 404

    target_roles = json.loads(campaign.target_roles or "[]")
    target_groups = json.loads(campaign.target_groups or "[]")
    business_id = campaign.business_id

    print(f" Roles: {target_roles}")
    print(f" Groups: {target_groups}")
    print(f" Business ID: {business_id}")

    role_contacts = Contact.query.filter(
        Contact.business_id == business_id,
        Contact.role.in_(target_roles)
    ).all()

    group_contact_ids = db.session.query(ContactGroup.contact_id).filter(
        ContactGroup.group_id.in_(target_groups)
    ).subquery()

    group_contacts = Contact.query.filter(
        Contact.business_id == business_id,
        Contact.id.in_(group_contact_ids)
    ).all()

    all_contacts = {c.email for c in role_contacts + group_contacts if c.email}
    recipients = list(all_contacts)

    print(f" Recipients: {recipients}")

    if not recipients:
        print("⚠️ No recipients to send to.")
        return {"error": "No recipients found."}, 400

    sender_email = current_app.config['MAIL_USERNAME']
    sender_password = current_app.config['MAIL_PASSWORD']

    subject = campaign.name
    body = campaign.message_text
    image_path = campaign.image_path or campaign.design_image
    fs_path = to_fs_path(image_path)

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = ", ".join(recipients)
    msg.set_content(body)

    if fs_path and os.path.exists(fs_path):
        print(f"📎 Attaching image from FS: {fs_path}")
        ctype, _ = mimetypes.guess_type(fs_path)
        maintype, subtype = (ctype.split('/', 1) if ctype else ('application', 'octet-stream'))
        with open(fs_path, "rb") as img:
            msg.add_attachment(
                img.read(),
                maintype=maintype,
                subtype=subtype,
                filename=os.path.basename(fs_path)
            )
    else:
        print(f"📎 No image attached (path missing or not found) image_path={image_path} fs_path={fs_path}")

    try:
        print(" Connecting to SMTP...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
        print(" Email sent!")
        return {"message": f"Email sent to {len(recipients)} contacts."}, 200
    except Exception as e:
        print(f" Error sending email: {e}")
        return {"error": str(e)}, 500

def send_email(to, subject, body):
    EMAIL_ADDRESS = current_app.config['MAIL_USERNAME']
    EMAIL_PASSWORD = current_app.config['MAIL_PASSWORD']

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to
    msg.set_content(body)

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
        return {"message": "Email sent successfully."}, 200
    except Exception as e:
        return {"error": str(e)}, 500
