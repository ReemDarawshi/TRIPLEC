# קובץ זה אחראי על ניהול שלב הסיום של תהליך הקמפיין במערכת TRIPLE, כולל שליחה, שליפה, ויצירת טקסטים שיווקיים מבוססי בינה מלאכותית.
# הוא כולל את הפונקציות הבאות:
# 1. שליפת קמפיין לפי מזהה – מחזירה מידע בסיסי על הקמפיין לצורכי תצוגה או עריכה.
# 2. שליפת אנשי קשר מתאימים לקמפיין – מחברת בין אנשי קשר לפי תפקידים או קבוצות יעד.
# 3. שליחת הודעת סמס בודדת – מקבלת מספר טלפון והודעה ושולחת באמצעות Twilio או שירות אחר.
# 4. הפעלת מחולל טקסטים שיווקיים – שולחת את פרטי הקמפיין והמותג למודל בינה מלאכותית ומחזירה שלושה טקסטים שיווקיים רלוונטיים.
# הקובץ תומך רק במשתמשים מחוברים ומוודא גישה לפי מזהה קמפיין ומזהה עסק  

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import db, Campaign, User, Contact, ContactGroup, BrandSettings, Group
from backend.utils.ai_generator import generate_campaign_text
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException
from datetime import datetime
import json
import os
import openai

campaign_bp = Blueprint('campaigns', __name__, url_prefix='/api/campaigns')


def _authenticated_campaign_user():
    """Derive tenant from the JWT identity, never from request data."""
    user = User.query.get(get_jwt_identity())
    if user is None:
        from flask import abort
        abort(403)
    return user


def _owned_campaign_or_404(campaign_id):
    """Treat campaigns owned by other businesses as not found."""
    user = _authenticated_campaign_user()
    return Campaign.query.filter_by(
        campaign_id=campaign_id,
        business_id=user.business_id,
    ).first_or_404()


# יצירת קמפיין חדש
@campaign_bp.route('', methods=['POST'])
@jwt_required()
def create_campaign():
    data = request.get_json() or {}

    current_user = User.query.get(get_jwt_identity())
    if not current_user:
        return jsonify({'error': 'Unauthorized'}), 403

    name = (data.get('name') or '').strip()
    campaign_type = (data.get('type') or '').strip()
    sender_id = data.get('sender_id')
    target_groups = data.get('target_groups', [])
    target_roles = data.get('target_roles', [])

    # שדות חובה
    if not name:
        return jsonify({'error': 'Campaign name is required'}), 400

    if not campaign_type:
        return jsonify({'error': 'Campaign objective is required'}), 400

    # לפחות קהל אחד: קבוצה או תפקיד
    if not target_groups and not target_roles:
        return jsonify({
            'error': 'At least one target group or target role is required'
        }), 400

    # ולידציה בסיסית של מבנה הנתונים
    if not isinstance(target_groups, list):
        return jsonify({'error': 'target_groups must be a list'}), 400

    if not isinstance(target_roles, list):
        return jsonify({'error': 'target_roles must be a list'}), 400

    # אימות שולח
    sender = User.query.filter(
        User.id == sender_id,
        User.business_id == current_user.business_id,
        User.role.in_(["admin", "marketing"])
    ).first()

    if not sender:
        return jsonify({'error': 'Invalid sender'}), 400

    # אימות שכל הקבוצות שייכות לעסק המחובר
    if target_groups:
        valid_groups = Group.query.filter(
            Group.id.in_(target_groups),
            Group.business_id == current_user.business_id
        ).all()

        valid_group_ids = {group.id for group in valid_groups}

        if len(valid_group_ids) != len(set(target_groups)):
            return jsonify({
                'error': 'One or more target groups are invalid'
            }), 400

    new_campaign = Campaign(
        name=name,
        sender_id=sender.id,
        type=campaign_type,
        business_id=current_user.business_id,
        target_groups=json.dumps(target_groups),
        target_roles=json.dumps(target_roles)
    )

    try:
        db.session.add(new_campaign)
        db.session.commit()

        return jsonify({'id': new_campaign.campaign_id}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# שליפת כל הקמפיינים
@campaign_bp.route('', methods=['GET'])
@jwt_required()
def get_all_campaigns():
    campaigns = Campaign.query.filter_by(
        business_id=_authenticated_campaign_user().business_id
    ).all()
    return jsonify([
        {
            'campaign_id': c.campaign_id,
            'name': c.name,
            'content_description': c.content_description,
            'sender_id': c.sender_id,
            'type': c.type,
            'status': c.status,
            'target_groups': c.target_groups,
            'target_roles': c.target_roles,
            'selected_template': c.selected_template,
            'ai_prompt': c.ai_prompt,
            'ai_template_id': c.ai_template_id,
            'design_id': c.design_id,
            'message_text': c.message_text,
            'channel': c.channel,
            'scheduled_at': c.scheduled_at.isoformat() if c.scheduled_at else None,
            'created_at': c.created_at.isoformat() if c.created_at else None
        } for c in campaigns
    ])


# עדכון פרטי טיוטה בלבד: אינו מפעיל AI או שליחה.
@campaign_bp.route('/<int:campaign_id>/draft-details', methods=['PUT'])
@jwt_required()
def update_campaign_draft_details(campaign_id):
    user = _authenticated_campaign_user()
    if user.role not in ('admin', 'marketing'):
        return jsonify({'error': 'Insufficient permissions'}), 403

    campaign = _owned_campaign_or_404(campaign_id)
    if campaign.status != 'draft':
        return jsonify({'error': 'Only draft campaigns can be edited'}), 409

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON object'}), 400

    name = data.get('name')
    campaign_type = data.get('type')
    sender_id = data.get('sender_id')
    target_groups = data.get('target_groups')
    target_roles = data.get('target_roles')

    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 200:
        return jsonify({'error': 'Invalid campaign name'}), 400
    if not isinstance(campaign_type, str) or not campaign_type.strip() or len(campaign_type.strip()) > 50:
        return jsonify({'error': 'Invalid campaign type'}), 400
    if not isinstance(target_groups, list) or not isinstance(target_roles, list):
        return jsonify({'error': 'Target groups and roles must be lists'}), 400
    if not target_groups and not target_roles:
        return jsonify({'error': 'At least one audience is required'}), 400
    if any(type(group_id) is not int for group_id in target_groups):
        return jsonify({'error': 'Invalid group identifiers'}), 400
    if any(not isinstance(role, str) or role not in ('לקוחות', 'ספקים', 'סוכנים') for role in target_roles):
        return jsonify({'error': 'Invalid target roles'}), 400

    try:
        sender_id = int(sender_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid sender'}), 400

    sender = User.query.filter(
        User.id == sender_id,
        User.business_id == user.business_id,
        User.role.in_(['admin', 'marketing'])
    ).first()
    if sender is None:
        return jsonify({'error': 'Invalid sender'}), 400

    valid_group_ids = {
        item.id for item in Group.query.filter(
            Group.id.in_(target_groups),
            Group.business_id == user.business_id
        ).all()
    } if target_groups else set()
    if valid_group_ids != set(target_groups):
        return jsonify({'error': 'Invalid target groups'}), 400

    try:
        campaign.name = name.strip()
        campaign.type = campaign_type.strip()
        campaign.sender_id = sender.id
        campaign.target_groups = json.dumps(target_groups)
        campaign.target_roles = json.dumps(target_roles)
        db.session.commit()
        return jsonify({'message': 'Draft details saved', 'id': campaign.campaign_id}), 200
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Failed to save draft'}), 500


# עדכון קמפיין קיים
@campaign_bp.route('/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    data = request.get_json()
    campaign = _owned_campaign_or_404(campaign_id)

    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404

    try:
        campaign.name = data.get('name', campaign.name)
        campaign.content_description = data.get('content_description', campaign.content_description)
        campaign.sender_id = data.get('sender_id', campaign.sender_id)
        campaign.type = data.get('type', campaign.type)
        campaign.status = data.get('status', campaign.status)
        campaign.target_groups = json.dumps(data.get('target_groups', json.loads(campaign.target_groups or "[]")))
        campaign.target_roles = json.dumps(data.get('target_roles', json.loads(campaign.target_roles or "[]")))
        campaign.selected_template = data.get('selected_template', campaign.selected_template)
        campaign.ai_prompt = data.get('ai_prompt', campaign.ai_prompt)
        campaign.ai_template_id = data.get('ai_template_id', campaign.ai_template_id)
        # Design changes must go through the dedicated, validated design route.
        campaign.message_text = data.get('message_text', campaign.message_text)
        campaign.channel = data.get('channel', campaign.channel)

        if 'scheduled_at' in data:
            campaign.scheduled_at = datetime.strptime(data['scheduled_at'], "%Y-%m-%dT%H:%M")

        db.session.commit()
        return jsonify({'message': 'Campaign updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# מחיקת קמפיין
@campaign_bp.route('/<int:campaign_id>', methods=['DELETE'])
@jwt_required()
def delete_campaign(campaign_id):
    try:
        campaign = _owned_campaign_or_404(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        db.session.delete(campaign)
        db.session.commit()
        return jsonify({'message': 'Campaign deleted successfully'}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# שליחת קמפיין בפועל
@campaign_bp.route('/send_campaign', methods=['POST'])
@jwt_required()
def send_campaign():
    data = request.json
    campaign_id = data.get('campaign_id')

    try:
        campaign = _owned_campaign_or_404(campaign_id)
        channel = campaign.channel or data.get('channel', 'email')
        message_text = campaign.message_text or data.get('message_text', '')
        # Image selection is persisted at the design step. A send request
        # must not overwrite it with a caller-supplied path.
        image_path = campaign.image_path

        target_roles = json.loads(campaign.target_roles or "[]")
        target_groups = json.loads(campaign.target_groups or "[]")
        business_id = campaign.business_id

        role_contacts = Contact.query.filter(
            Contact.business_id == business_id,
            Contact.role.in_(target_roles)
        ).all()

        group_contact_ids = db.session.query(ContactGroup.contact_id).filter(
            ContactGroup.group_id.in_(target_groups),
            ContactGroup.group_id.in_(
                db.session.query(Group.id).filter_by(business_id=business_id)
            )
        ).subquery()

        group_contacts = Contact.query.filter(
            Contact.business_id == business_id,
            Contact.id.in_(group_contact_ids)
        ).all()

        all_contacts = role_contacts + group_contacts

        if channel.lower() == 'email':
            campaign.status = 'sent'
            campaign.scheduled_at = datetime.utcnow()
            db.session.commit()
            from backend.email_sender import send_email_for_campaign
            response, status_code = send_email_for_campaign(campaign_id)
            return jsonify(response), status_code

        elif channel.lower() == 'whatsapp':
            links = []
            for contact in all_contacts:
                phone = contact.phone
                if phone:
                    clean_phone = phone.strip().replace("+", "").replace("-", "").replace(" ", "")
                    if not clean_phone.startswith("972"):
                        continue
                    url = f"https://wa.me/{clean_phone}?text={message_text}"
                    links.append(url)

            if not links:
                return jsonify({"error": "No valid WhatsApp recipients"}), 400

            campaign.status = 'sent'
            campaign.scheduled_at = datetime.utcnow()
            db.session.commit()

            return jsonify({"message": "WhatsApp links generated", "links": links}), 200

        elif channel.lower() == 'sms':
            from backend.sms_sender import send_sms
            count = 0
            for contact in all_contacts:
                phone = contact.phone
                if phone:
                    try:
                        send_sms(phone, message_text)
                        count += 1
                    except Exception as e:
                        print(f"❌ SMS failed to {phone}: {e}")

            campaign.status = 'sent'
            campaign.scheduled_at = datetime.utcnow()
            db.session.commit()

            return jsonify({"message": f"SMS sent to {count} contacts."}), 200

        else:
            return jsonify({"error": "Unsupported channel"}), 400

    except HTTPException:
        raise
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@campaign_bp.route('/<int:campaign_id>/ai', methods=['PUT'])
@jwt_required()
def update_campaign_ai(campaign_id):
    data = request.json
    try:
        campaign = _owned_campaign_or_404(campaign_id)
        campaign.target_groups = json.dumps(data.get('target_groups', []))
        campaign.target_roles = json.dumps(data.get('roles', []))
        campaign.ai_prompt = data.get('ai_prompt')
        campaign.selected_template = data.get('selected_template')
        db.session.commit()
        return jsonify({"message": "AI stage updated successfully"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@campaign_bp.route('/<int:campaign_id>/design', methods=['PUT'])
@jwt_required()
def update_campaign_design(campaign_id):
    """Save the selected copy and, optionally, a poster created for this campaign."""
    import re

    user = _authenticated_campaign_user()
    if user.role not in ('admin', 'marketing'):
        return jsonify({'error': 'Insufficient permissions'}), 403

    campaign = _owned_campaign_or_404(campaign_id)
    if campaign.status != 'draft':
        return jsonify({'error': 'Only drafts can be edited'}), 409

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON object'}), 400

    message_text = data.get('message_text')
    if not isinstance(message_text, str) or not message_text.strip():
        return jsonify({'error': 'Campaign text is required'}), 400

    design_id = data.get('selected_design_id')
    image_path = data.get('image_path')
    if image_path is None and design_id is None:
        # Text-only campaigns are valid.
        pass
    elif not isinstance(image_path, str) or not isinstance(design_id, str):
        return jsonify({'error': 'Design ID and image are required together'}), 400
    else:
        # html_poster_renderer.py emits:
        # campaign_{campaign_id}_{design_id}_{uuid.uuid4().hex}.png
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,64}', design_id):
            return jsonify({'error': 'Invalid design ID'}), 400
        prefix = f'campaign_{campaign_id}_{design_id}_'
        image_name_pattern = re.escape(prefix) + r'[0-9a-f]{32}\.png'
        filename = image_path.rsplit('/', 1)[-1]
        if (not re.fullmatch(image_name_pattern, filename)
                or image_path != f'/static/uploads/poster_html/{filename}'):
            return jsonify({'error': 'Invalid design image'}), 400

        # For newly generated batches, verify that this exact poster was
        # issued to this campaign. Keep legacy filename validation above for
        # campaigns created before poster_options was introduced.
        saved_batch = campaign.poster_options
        if isinstance(saved_batch, dict) and saved_batch.get('posters'):
            if not any(
                isinstance(item, dict)
                and item.get('id') == design_id
                and item.get('imageSrc') == image_path
                for item in saved_batch['posters']
            ):
                return jsonify({'error': 'Design does not belong to saved poster options'}), 400

        # The renderer uses the project root's static/uploads/poster_html.
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        file_path = os.path.join(project_root, 'static', 'uploads', 'poster_html', filename)
        if not os.path.isfile(file_path):
            return jsonify({'error': 'Design file not found'}), 400

    try:
        campaign.design_id = design_id
        campaign.message_text = message_text.strip()
        campaign.image_path = image_path
        db.session.commit()
        return jsonify({'message': 'Design selection updated successfully'}), 200
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Could not save design selection'}), 500


@campaign_bp.route('/<int:campaign_id>/delivery', methods=['PUT'])
@jwt_required()
def update_campaign_delivery(campaign_id):
    data = request.json
    try:
        campaign = _owned_campaign_or_404(campaign_id)
        campaign.message_text = data.get('message_text')
        campaign.channel = data.get('channel')
        if 'scheduled_at' in data:
            campaign.scheduled_at = datetime.strptime(data['scheduled_at'], "%Y-%m-%dT%H:%M")
        campaign.status = "scheduled" if campaign.scheduled_at else "sent"
        db.session.commit()
        return jsonify({"message": "Delivery details updated successfully"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400


@campaign_bp.route('/<int:campaign_id>/schedule', methods=['PUT'])
@jwt_required()
def schedule_campaign(campaign_id):
    data = request.get_json()
    try:
        campaign = _owned_campaign_or_404(campaign_id)

        if 'scheduled_at' in data:
            campaign.scheduled_at = datetime.strptime(data['scheduled_at'], "%Y-%m-%dT%H:%M:%S")
        if 'channel' in data:
            campaign.channel = data['channel']
        if 'message_text' in data:
            campaign.message_text = data['message_text']

        campaign.status = "scheduled"
        db.session.commit()
        return jsonify({"message": "Campaign scheduled successfully"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400


@campaign_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_campaigns_summary():
    try:
        campaigns = Campaign.query.filter_by(
        business_id=_authenticated_campaign_user().business_id
    ).all()
        result = []

        for c in campaigns:
            result.append({
                'id': c.campaign_id,
                'title': c.name,
                'channel': c.channel,
                'date': c.scheduled_at.strftime('%Y-%m-%d') if c.scheduled_at else '',
                'time': c.scheduled_at.strftime('%H:%M') if c.scheduled_at else '',
                'status': translate_status(c.status),
                'status_code': c.status,
                'sender': get_user_name(c.sender_id)
            })

        return jsonify(result), 200

    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500


@campaign_bp.route('/scheduled', methods=['GET'])
@jwt_required()
def get_scheduled_campaigns():
    try:
        campaigns = Campaign.query.filter_by(
            business_id=_authenticated_campaign_user().business_id,
            status='scheduled'
        ).all()
        result = []

        for c in campaigns:
            result.append({
                'id': c.campaign_id,
                'title': c.name,
                'channel': c.channel,
                'date': c.scheduled_at.strftime('%Y-%m-%d') if c.scheduled_at else '',
                'time': c.scheduled_at.strftime('%H:%M') if c.scheduled_at else '',
                'status': translate_status(c.status),
                'sender': get_user_name(c.sender_id)
            })

        return jsonify(result), 200
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500


@campaign_bp.route('/senders', methods=['GET'])
@jwt_required()
def get_senders():
    current_user = User.query.get(get_jwt_identity())

    if not current_user:
        return jsonify({'error': 'Unauthorized'}), 403

    senders = User.query.filter(
        User.business_id == current_user.business_id,
        User.role.in_(["admin", "marketing"])
    ).all()

    return jsonify([
        {"id": user.id, "full_name": user.full_name}
        for user in senders
    ])


# פונקציית עזר – החזרת שם שולח לפי מזהה
def get_user_name(user_id):
    user = User.query.filter_by(
        id=user_id, business_id=_authenticated_campaign_user().business_id
    ).first()
    return user.full_name if user else 'לא ידוע'


# תרגום סטטוס לעברית
def translate_status(status):
    mapping = {
        'draft': 'טיוטה',
        'sent': 'נשלח',
        'scheduled': 'מתוזמן',
        'failed': 'נכשל'
    }
    return mapping.get(status, 'לא ידוע')

# הגדרת מפתח OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

@campaign_bp.route('/<int:campaign_id>', methods=['GET'])
@jwt_required()
def get_campaign_by_id(campaign_id):
    campaign = _owned_campaign_or_404(campaign_id)
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404

    # Older campaigns may have JSON-encoded strings in these JSON columns.
    # Return arrays consistently so the frontend can restore draft selections.
    def normalize_list(value):
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                result = json.loads(value)
                return result if isinstance(result, list) else []
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    return jsonify({
        'campaign_id': campaign.campaign_id,
        'name': campaign.name,
        'type': campaign.type,
        'sender_id': campaign.sender_id,
        'target_groups': normalize_list(campaign.target_groups),
        'target_roles': normalize_list(campaign.target_roles),
        'status': campaign.status,
        'ai_prompt': campaign.ai_prompt,
        'ai_text_options': campaign.ai_text_options,
        'poster_options': campaign.poster_options,
        'message_text': campaign.message_text,
        'design_id': campaign.design_id,
        'image_path': campaign.image_path,
        'channel': campaign.channel,
        'scheduled_at': (
            campaign.scheduled_at.isoformat()
            if campaign.scheduled_at else None
        ),
        'created_at': (
            campaign.created_at.isoformat()
            if campaign.created_at else None
        )
    })

@campaign_bp.route('/contacts/for_campaign/<int:campaign_id>', methods=['GET'])
@jwt_required()
def get_contact_phones_for_campaign(campaign_id):
    campaign = _owned_campaign_or_404(campaign_id)

    target_roles = json.loads(campaign.target_roles or "[]")
    target_groups = json.loads(campaign.target_groups or "[]")
    business_id = campaign.business_id

    role_contacts = Contact.query.filter(
        Contact.business_id == business_id,
        Contact.role.in_(target_roles)
    ).all()

    group_contact_ids = db.session.query(ContactGroup.contact_id).filter(
        ContactGroup.group_id.in_(target_groups),
        ContactGroup.group_id.in_(
            db.session.query(Group.id).filter_by(business_id=business_id)
        )
    ).subquery()

    group_contacts = Contact.query.filter(
        Contact.business_id == business_id,
        Contact.id.in_(group_contact_ids)
    ).all()

    all_contacts = {c.phone for c in role_contacts + group_contacts if c.phone}
    return jsonify(list(all_contacts)), 200


@campaign_bp.route('/send_sms', methods=['POST'])
@jwt_required()
def send_sms_route():
    data = request.get_json(silent=True) or {}
    phone = data.get('phone')
    message = data.get('message')
    user = _authenticated_campaign_user()
    # This standalone endpoint must not act as an arbitrary SMS relay.
    if not isinstance(phone, str) or not phone.strip() or not isinstance(message, str) or not message.strip():
        return jsonify({'error': 'Phone and message are required'}), 400
    if not Contact.query.filter_by(business_id=user.business_id, phone=phone).first():
        return jsonify({'error': 'Recipient not found'}), 404

    try:
        from backend.sms_sender import send_sms
        sid = send_sms(phone, message)
        return jsonify({"status": "success", "sid": sid}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@campaign_bp.route('/ai/texts', methods=['POST'])
@jwt_required()
def generate_ai_texts():
    data = request.get_json()
    campaign_id = data.get("campaign_id")
    if not campaign_id:
        return jsonify({"error": "Missing campaign_id"}), 400

    campaign = _owned_campaign_or_404(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    brand = BrandSettings.query.filter_by(business_id=campaign.business_id).first()
    if not brand:
        return jsonify({"error": "Brand settings not found"}), 404

    prompt = campaign.ai_prompt or ""
    result = generate_campaign_text(
        prompt=prompt,
        brand=brand,
        campaign=campaign
    )

    return jsonify({
        "texts": result["texts"]
    })
