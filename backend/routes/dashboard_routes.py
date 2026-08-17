# קובץ זה אחראי על שליפת נתונים לדשבורד הראשי של המשתמש במערכת 
# הוא כולל פונקציה אחת עיקרית שמחזירה סיכום של קמפיינים לפי מזהה העסק מהטוקן:
# - סך כל הקמפיינים שנשלחו, מתוזמנים ונכשלו.
# - הקמפיין האחרון שנשלח כולל תאריך וסטטיסטיקות (אם קיימות).
# - הקמפיין הבא המתוזמן (אם קיים) עם שם, תאריך וערוץ שליחה.
# - חלוקה סטטיסטית לפי ערוצים (דוא"ל, סמס, וואטסאפ).
# הנתונים נשלפים לפי מזהה העסק שמתקבל מהטוקן של המשתמש המחובר.

from flask import Blueprint, jsonify
from backend.models.models import Campaign, User
from sqlalchemy import desc
from datetime import datetime
from backend.routes.auth_routes import decode_token
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    try:
        now = datetime.now()

        # שליפת ה-business_id מהטוקן
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_data = decode_token(token)
        business_id = user_data.get('business_id')  # זה מה שצריך להיות בטוקן שלך

        # שליפת קמפיינים של העסק בלבד
        sent_campaigns = Campaign.query.filter_by(status='sent', business_id=business_id).all()
        scheduled_campaigns = Campaign.query.filter_by(status='scheduled', business_id=business_id).all()
        failed_campaigns = Campaign.query.filter_by(status='failed', business_id=business_id).all()

        last_campaign = Campaign.query.filter_by(status='sent', business_id=business_id).order_by(desc(Campaign.scheduled_at)).first()
        next_campaign = Campaign.query.filter(Campaign.status == 'scheduled', Campaign.business_id == business_id, Campaign.scheduled_at > now).order_by(Campaign.scheduled_at).first()

        # ספירת ערוצים
        channel_counts = {}
        for c in sent_campaigns:
            channel_counts[c.channel] = channel_counts.get(c.channel, 0) + 1

        data = {
            "sent_count": len(sent_campaigns),
            "scheduled_count": len(scheduled_campaigns),
            "failed_count": len(failed_campaigns),
            "last_campaign": {
                "name": last_campaign.name if last_campaign else "לא נמצא",
                "date": last_campaign.scheduled_at.strftime("%d/%m/%Y") if last_campaign else "",
                "sent": getattr(last_campaign, 'total_sent', 0),
                "opened": getattr(last_campaign, 'total_opened', 0)
            },
            "next_campaign": {
                "name": next_campaign.name if next_campaign else "לא קיים",
                "date": next_campaign.scheduled_at.strftime("%d/%m/%Y") if next_campaign else "",
                "channel": next_campaign.channel if next_campaign else ""
            },
            "channels_stats": [
                {"channel": k, "sent": v} for k, v in channel_counts.items()
            ]
        }

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
