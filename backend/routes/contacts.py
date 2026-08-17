
# קובץ זה אחראי על ניהול אנשי הקשר במערכת 
# 1. שליפת אנשי הקשר של עסק לפי business_id.
# 2. יצירת איש קשר חדש או עדכון/מחיקה של קיים.
# 3. שליפת תפקידים ייחודיים (לקוחות, סוכנים, ספקים וכו').
# 4. הוספה מרוכזת (bulk) של אנשי קשר עם סינון כפולים לפי טלפון ואימייל.
# 5. שליפת אנשי קשר לפי קמפיין – מבוסס על תפקידים או קבוצות יעד שנבחרו בקמפיין.
# הקובץ תומך גם בהוספה ממסך אקסל או UI וכולל בקרות כפילות לשמירה על תקינות הנתונים במסד.

from flask import Blueprint, request, jsonify
from backend.models.models import db, Contact
from sqlalchemy.exc import SQLAlchemyError
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import User
from backend.models.models import Campaign, ContactGroup

contacts_bp = Blueprint('contacts', __name__, url_prefix='/api/contacts')

def contact_to_dict(contact):
    return {
        'id': contact.id,  
        'first_name': contact.first_name,
        'last_name': contact.last_name,
        'email': contact.email,
        'phone': contact.phone,
        'role': contact.role,
        'vip': contact.vip
    }
# שליפת כל אנשי הקשר
@contacts_bp.route('', methods=['GET'])
def get_contacts():
    business_id = request.args.get('business_id')
    if not business_id:
        return jsonify({'error': 'business_id is required'}), 400

    contacts = Contact.query.filter_by(business_id=business_id).all()
    return jsonify([contact_to_dict(c) for c in contacts])


# יצירת איש קשר חדש
@contacts_bp.route('', methods=['POST'])
def create_contact():
    data = request.get_json()
    try:
        new_contact = Contact(
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone=data.get('phone'),
            email=data.get('email'),
            role=data.get('role'),
            vip=data.get('vip', False),
            business_id=data.get('business_id')  
        )
        db.session.add(new_contact)
        db.session.commit()
        return jsonify({'message': 'Contact created successfully', 'id': new_contact.id}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# עדכון איש קשר קיים
@contacts_bp.route('/<int:contact_id>', methods=['PUT'])
@jwt_required()
def update_contact(contact_id):
    current_user = User.query.get(get_jwt_identity())

    if not current_user:
        return jsonify({'error': 'Unauthorized'}), 403

    contact = Contact.query.filter_by(
        id=contact_id,
        business_id=current_user.business_id
    ).first()

    if not contact:
        return jsonify({'error': 'Contact not found'}), 404

    data = request.get_json() or {}

    try:
        contact.first_name = data.get('first_name', contact.first_name)
        contact.last_name = data.get('last_name', contact.last_name)
        contact.phone = data.get('phone', contact.phone)
        contact.email = data.get('email', contact.email)
        contact.role = data.get('role', contact.role)
        contact.vip = data.get('vip', contact.vip)

        db.session.commit()

        return jsonify({
            'message': 'Contact updated successfully',
            'contact': contact_to_dict(contact)
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# מחיקת איש קשר
@contacts_bp.route('/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    contact = Contact.query.get(contact_id)
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404
    try:
        db.session.delete(contact)
        db.session.commit()
        return jsonify({'message': 'Contact deleted successfully'})
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# שליפת רשימת תפקידים ייחודיים (לקוחות, ספקים, סוכנים וכו')
@contacts_bp.route('/roles', methods=['GET'])
def get_unique_roles():
    try:
        roles = db.session.query(Contact.role).distinct().all()
        roles_list = [r[0] for r in roles if r[0] is not None]
        return jsonify(roles_list)
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/bulk', methods=['POST'])
@jwt_required()
def bulk_create_contacts():
    data = request.get_json()
    contacts = data.get('contacts', [])
    business_id = data.get('business_id')

    if not business_id:
        return jsonify({"error": "business_id required"}), 400

    saved_contacts = []
    try:
        # שליפה של אימיילים וטלפונים קיימים לאותו business
        existing_contacts = Contact.query.filter_by(business_id=business_id).all()
        existing_emails = {c.email for c in existing_contacts if c.email}
        existing_phones = {c.phone for c in existing_contacts if c.phone}

        for c in contacts:
            email = c.get('email')
            phone = c.get('phone')

            if email in existing_emails or phone in existing_phones:
                continue  # דלג על אנשי קשר עם אימייל או טלפון כפול

            new_contact = Contact(
                first_name=c['first_name'],
                last_name=c['last_name'],
                phone=phone,
                email=email,
                role=c['role'],
                vip=c.get('vip', False),
                business_id=business_id
            )
            db.session.add(new_contact)
            db.session.flush()  

            saved_contacts.append({
                "id": new_contact.id,
                "first_name": new_contact.first_name,
                "last_name": new_contact.last_name,
                "email": new_contact.email,
                "phone": new_contact.phone,
                "role": new_contact.role,
            })

        db.session.commit()
        return jsonify({"saved_contacts": saved_contacts}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@contacts_bp.route('/contacts/for_campaign/<int:campaign_id>', methods=['GET'])
@jwt_required()
def get_contacts_for_campaign(campaign_id):
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    target_roles = campaign.target_roles or []
    target_groups = campaign.target_groups or []

    role_contacts = Contact.query.filter(
        Contact.business_id == campaign.business_id,
        Contact.role.in_(target_roles)
    ).all()

    group_contact_ids = db.session.query(ContactGroup.contact_id).filter(
        ContactGroup.group_id.in_(target_groups)
    ).subquery()

    group_contacts = Contact.query.filter(
        Contact.business_id == campaign.business_id,
        Contact.id.in_(group_contact_ids)
    ).all()

    all_contacts = {c.id: c for c in role_contacts + group_contacts}.values()

    return jsonify([
        {
            "id": c.id,
            "full_name": f"{c.first_name} {c.last_name}",
            "phone": c.phone,
            "email": c.email,
        } for c in all_contacts
    ]), 200
