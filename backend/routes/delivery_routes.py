# קובץ זה מטפל בלוגיקת שליחת הקמפיינים במערכת TRIPLE.
# הוא כולל שלוש פעולות עיקריות:
# 1. יצירת רשומה של משלוח חדש במסד הנתונים כולל שם קמפיין, שולח, סוג, קהל יעד, טקסט, עיצוב, ערוץ שליחה ועוד.
# 2. שליפת כל הקמפיינים שנשלחו או מתוזמנים – כולל נתוני קמפיין ותאריך יצירה.
# 3. שליחת קמפיין בפועל דרך אימייל על בסיס מזהה הקמפיין, באמצעות פונקציית עזר חיצונית `send_email_for_campaign`.
# הקובץ תומך בשליחה אמיתית ובלוגיקת תיעוד של כל ניסיון שליחה.

from flask import Blueprint, request, jsonify
from backend.models.models import db, Delivery
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from backend.email_sender import send_email_for_campaign


delivery_bp = Blueprint('delivery', __name__, url_prefix='/api/deliveries')

@delivery_bp.route('', methods=['POST'])
def create_delivery():
    data = request.get_json()
    try:
        new_delivery = Delivery(
            campaign_name=data['campaign_name'],
            sender_name=data['sender_name'],
            campaign_type=data['campaign_type'],
            audience=data['audience'],
            prompt=data.get('prompt'),
            design_image=data.get('design_image'),
            message_text=data.get('message_text'),
            channel=data['channel'],
            status='pending',  
            created_at=datetime.utcnow()
        )
        db.session.add(new_delivery)
        db.session.commit()
        return jsonify({'message': 'Delivery created', 'id': new_delivery.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@delivery_bp.route('', methods=['GET'])
def get_all_deliveries():
    deliveries = Delivery.query.all()
    return jsonify([
        {
            'id': d.id,
            'campaign_name': d.campaign_name,
            'sender_name': d.sender_name,
            'campaign_type': d.campaign_type,
            'audience': d.audience.split(',') if d.audience else [],
            'prompt': d.prompt,
            'design_image': d.design_image,
            'message_text': d.message_text,
            'channel': d.channel,
            'status': d.status,
            'created_at': d.created_at.isoformat()
        } for d in deliveries
    ])


delivery_bp = Blueprint("delivery", __name__, url_prefix="/api/delivery")

@delivery_bp.route("/send/<int:campaign_id>", methods=["POST"])
def send_campaign_email(campaign_id):
    result, status = send_email_for_campaign(campaign_id)
    return jsonify(result), 

