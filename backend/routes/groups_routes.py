"""
קובץ זה מכיל את כל הנתיבים (routes) שקשורים לניהול קבוצות מערכת TRIPLE,
ומטפל בכל הפעולות המרכזיות שקשורות ביצירה, עדכון, מחיקה ושליפה של קבוצות 
ואנשי קשר הקשורים אליהן. הקובץ עובד עם JWT לזיהוי המשתמש וכולל את הפונקציונליות הבאה:

🔹 שליפת כל הקבוצות של העסק הנוכחי כולל אנשי הקשר שבהן.
🔹 יצירת קבוצה חדשה (POST).
🔹 עדכון קבוצה קיימת, כולל שינוי פרטי הקבוצה ורשימת אנשי הקשר.
🔹 מחיקת קבוצה מהמערכת.
🔹 הוספת איש קשר חדש לקבוצה באופן ידני.
🔹 הוספת אנשי קשר לקבוצה מקובץ Excel.
🔹 הוספת אנשי קשר קיימים לקבוצה מסוימת.
🔹 שליפת רשימת הקהלים (תפקידים וקבוצות) הקיימים בעסק מסוים.
🔹 שליפת תפקידי אנשי קשר ייחודיים (roles) לפי מזהה העסק.
🔹 שמירה כוללת של כל הקבוצות כולל אנשי קשר חדשים או קיימים (save-all).
🔹 ייבוא אנשי קשר מקובץ Excel עם בדיקה כפולה שלא יווצרו כפילויות.

הקובץ עושה שימוש ב־SQLAlchemy לצורך פעולות מול מסד הנתונים וב־Pandas לקריאת קובצי Excel.
"""

from flask import Blueprint, request, jsonify
from backend.models.models import db, Group, Contact, ContactGroup
import pandas as pd
import os
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import User
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.utils import secure_filename


groups_bp = Blueprint('groups', __name__)

@groups_bp.route('', methods=['GET'])
@jwt_required()
def get_groups():
    current_user = User.query.get(get_jwt_identity())
    if not current_user:
        return jsonify({'error': 'Unauthorized'}), 403

    business_id = current_user.business_id
    groups = Group.query.filter_by(business_id=business_id).all()

    groups_data = []
    for group in groups:
        contacts_data = []
        for cg in group.contacts:
            contact = Contact.query.get(cg.contact_id)
            if contact:
                contacts_data.append({
                    'id': contact.id,
                    'first_name': contact.first_name,
                    'last_name': contact.last_name,
                    'phone': contact.phone,
                    'email': contact.email,
                    'role': contact.role
                })

        groups_data.append({
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'colorClass': group.color_class,
            'contacts': contacts_data
        })
    return jsonify(groups_data)


@groups_bp.route('', methods=['POST'])
@jwt_required()
# POST: יצירת קבוצה
def create_group():
    data = request.get_json()

    # ולידציה בסיסית
    name = data.get('name')
    description = data.get('description', '')
    color_class = data.get('colorClass', 'pastel-blue')
    business_id = data.get('business_id')

    if not name or not business_id:
        return jsonify({'error': 'Missing name or business_id'}), 400

    # יצירת קבוצה חדשה במסד הנתונים
    new_group = Group(
        name=name,
        description=description,
        color_class=color_class,
        business_id=business_id
    )
    db.session.add(new_group)
    db.session.commit()

    return jsonify({
        'id': new_group.id,
        'name': new_group.name,
        'description': new_group.description,
        'colorClass': new_group.color_class,
        'contacts': []
    }), 201


# PUT: עדכון קבוצה
@groups_bp.route('/<int:group_id>', methods=['PUT'])
def update_group(group_id):
    data = request.json
    group = Group.query.get_or_404(group_id)
    group.name = data.get('name', group.name)
    group.description = data.get('description', group.description)
    data.get('color_class', group.color_class)

    if 'contacts' in data:
        ContactGroup.query.filter_by(group_id=group_id).delete()
        for contact in data['contacts']:
            cg = ContactGroup(group_id=group_id, contact_id=contact['id'])
            db.session.add(cg)

    db.session.commit()
    return jsonify({'message': 'Group updated'})

# DELETE: מחיקת קבוצה
@groups_bp.route('/<int:group_id>', methods=['DELETE'])
def delete_group(group_id):
    group = Group.query.get_or_404(group_id)
    ContactGroup.query.filter_by(group_id=group_id).delete()
    db.session.delete(group)
    db.session.commit()
    return jsonify({'message': 'Group deleted'})

# POST: הוספת איש קשר ידנית
@groups_bp.route('/<int:group_id>/add_manual', methods=['POST'])
def add_contact_manual(group_id):
    data = request.json
    contact = Contact(
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        phone=data.get('phone', ''),
        email=data.get('email', ''),
        role=data.get('role', '')
    )
    db.session.add(contact)
    db.session.commit()

    cg = ContactGroup(group_id=group_id, contact_id=contact.id)
    db.session.add(cg)
    db.session.commit()

    return jsonify({'message': 'Contact added to group', 'contact_id': contact.id})

# POST: העלאה מאקסל
@groups_bp.route('/<int:group_id>/upload_excel', methods=['POST'])
def upload_excel(group_id):
    file = request.files['file']
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    filepath = os.path.join('uploads', file.filename)
    file.save(filepath)
    df = pd.read_excel(filepath)

    for _, row in df.iterrows():
        first_name = row.get('first_name') or row.get('שם פרטי') or ''
        last_name = row.get('last_name') or row.get('שם משפחה') or ''
        phone = row.get('phone') or row.get('טלפון') or ''
        email = row.get('email') or row.get('אימייל') or ''
        role = row.get('role') or row.get('תפקיד') or ''

        contact = Contact(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            email=email,
            role=role
        )
        db.session.add(contact)
        db.session.commit()

        cg = ContactGroup(group_id=group_id, contact_id=contact.id)
        db.session.add(cg)

    db.session.commit()
    os.remove(filepath)

    return jsonify({'message': 'Contacts uploaded and added to group'})

# POST: הוספת אנשי קשר קיימים
@groups_bp.route('/<int:group_id>/add_existing', methods=['POST'])
def add_existing_contacts(group_id):
    data = request.json
    contact_ids = data.get('contact_ids', [])

    for contact_id in contact_ids:
        exists = ContactGroup.query.filter_by(group_id=group_id, contact_id=contact_id).first()
        if not exists:
            cg = ContactGroup(group_id=group_id, contact_id=contact_id)
            db.session.add(cg)

    db.session.commit()
    return jsonify({'message': 'Existing contacts added to group'})

# GET: שליפת קהלי יעד (roles וקבוצות) לפי business_id
@groups_bp.route('/audiences', methods=['GET'])
def get_audiences():
    business_id = request.args.get('business_id')
    if not business_id:
        return jsonify({'error': 'business_id is required'}), 400

    # שליפת תפקידים ייחודיים מהאנשי קשר
    roles_query = db.session.query(Contact.role).filter_by(business_id=business_id).distinct()
    roles = [r[0] for r in roles_query if r[0] is not None]

    # שליפת קבוצות יעד
    groups = Group.query.filter_by(business_id=business_id).all()
    group_list = [{'id': g.id, 'name': g.name} for g in groups]

    return jsonify({
        'roles': roles,
        'groups': group_list
    })

# GET: שליפת roles ייחודיים של אנשי קשר בעסק
@groups_bp.route('/roles', methods=['GET'])
def get_unique_roles():
    business_id = request.args.get('business_id')
    if not business_id:
        return jsonify({'error': 'business_id is required'}), 400

    roles = db.session.query(Contact.role).filter_by(business_id=business_id).distinct().all()
    role_list = [r[0] for r in roles if r[0]]  
    return jsonify(role_list)

@groups_bp.route('/save-all', methods=['POST'])
@jwt_required()
def save_all_groups():
    data = request.get_json()
    groups = data.get('groups', [])
    business_id = data.get('business_id')

    if not business_id:
        return jsonify({'error': 'Missing business_id'}), 400

    try:
        for group_data in groups:
            group_id = group_data.get('id')
            group = None

            # יצירת או עדכון קבוצה
            if group_id:
                group = Group.query.get(group_id)
                if group:
                    group.name = group_data.get('name', group.name)
                    group.description = group_data.get('description', group.description)
                    group.color_class = group_data.get('colorClass', group.color_class)
                    # מחיקת קישורים ישנים
                    ContactGroup.query.filter_by(group_id=group_id).delete()
            else:
                group = Group(
                    name=group_data.get('name'),
                    description=group_data.get('description'),
                    color_class=group_data.get('colorClass', 'pastel-blue'),
                    business_id=business_id
                )
                db.session.add(group)
                db.session.flush()  

            # טיפול באנשי קשר
            for contact_data in group_data.get('contacts', []):
                contact_id = contact_data.get('id')
                contact = Contact.query.get(contact_id) if contact_id else None

                if not contact:
                    contact = Contact(
                        first_name=contact_data['first_name'],
                        last_name=contact_data['last_name'],
                        phone=contact_data['phone'],
                        email=contact_data['email'],
                        role=contact_data['role'],
                        business_id=business_id
                    )
                    db.session.add(contact)
                    db.session.flush()  # מקבל contact.id

                # יצירת קשר בין הקבוצה לאיש הקשר
                cg = ContactGroup(group_id=group.id, contact_id=contact.id)
                db.session.add(cg)

        db.session.commit()
        return jsonify({'message': 'All groups saved successfully'}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/<int:group_id>/import_excel', methods=['POST'])
def import_contacts_excel(group_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join('uploads', filename)
        file.save(filepath)

        df = pd.read_excel(filepath)

        required_columns = ['first_name', 'last_name', 'email', 'phone', 'role']
        if not all(col in df.columns for col in required_columns):
            return jsonify({'error': 'Missing required columns in Excel'}), 400

        group = Group.query.get(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404

        for _, row in df.iterrows():
            contact = Contact.query.filter_by(email=row['email']).first()
            if not contact:
                contact = Contact(
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    phone=row.get('phone'),
                    email=row['email'],
                    role=row.get('role'),
                    vip=False,
                    business_id=group.business_id
                )
                db.session.add(contact)
                db.session.flush()  

            existing_link = ContactGroup.query.filter_by(contact_id=contact.id, group_id=group.id).first()
            if not existing_link:
                link = ContactGroup(contact_id=contact.id, group_id=group.id)
                db.session.add(link)

        db.session.commit()
        os.remove(filepath)
        return jsonify({'message': 'Contacts imported successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
