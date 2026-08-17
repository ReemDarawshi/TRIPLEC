"""
קובץ זה כולל את כל נקודות הקצה (endpoints) הדרושות לניהול משתמשים עבור אדמין במערכת,
ובפרט: יצירת משתמשים חדשים, שליחת מייל לאיפוס סיסמה, עדכון סיסמה, מחיקה ושליפה של כל המשתמשים.

 הפונקציות המרכזיות:

1.  add_user  יצירת משתמש חדש (רק ע"י אדמין) ושליחת מייל הגדרת סיסמה.
   - נוצר משתמש חדש ללא סיסמה.
   - נשלחת הודעת מייל עם לינק זמני להגדרת סיסמה (בתוקף לשעה).

2.  send_password_setup_email  שולחת מייל עם קישור להגדרת סיסמה למשתמש החדש.

3.  delete_user  מחיקת משתמש לפי מזהה (id).

4. reset_password  קביעת סיסמה חדשה ע"י המשתמש לאחר שקיבל לינק (כולל בדיקת תוקף הטוקן).

5.  get_users  שליפת כל המשתמשים הקשורים לאותו עסק של המשתמש המחובר (אדמין בלבד).
 שימושים טכנולוגיים:
- שימוש ב־JWT לאימות ובקרת הרשאות.
- שליחת מיילים עם ספריית smtplib.
- שימוש ב־SQLAlchemy לעבודה מול בסיס הנתונים.
- טוקן איפוס סיסמה מבוסס JWT עם תוקף של שעה בלבד.

"""
from flask import Blueprint, request, jsonify, current_app
from backend.models.models import db, User
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import generate_password_hash
import jwt
import datetime
import smtplib
from email.message import EmailMessage
import os
from flask_jwt_extended import get_jwt_identity, jwt_required, decode_token


users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['POST'])
@jwt_required()
def add_user():
    data = request.get_json()
    try:
        jwt_data = get_jwt_identity()
        user_id = jwt_data['sub'] if isinstance(jwt_data, dict) else jwt_data
        admin_user = User.query.get(user_id)

        if not admin_user or admin_user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        # שליפת הנתונים מהבקשה
        full_name = data['full_name']
        email = data['email']
        role = data.get('role', 'viewer')  # ברירת מחדל

        # בדיקה אם המשתמש כבר קיים
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        # יצירת יוזר חדש ללא סיסמה
        new_user = User(
            full_name=full_name,
            email=email,
            password_hash='',
            role=role,
            business_id=admin_user.business_id
        )
        db.session.add(new_user)
        db.session.commit()

        # יצירת טוקן איפוס סיסמה
        token = jwt.encode({
            'user_id': new_user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        FRONTEND_URL = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"


        send_password_setup_email(email, full_name, reset_link)

        return jsonify({
            'id': new_user.id,
            'message': 'User created and reset email sent ✅'
        })

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# פונקציית שליחת המייל
def send_password_setup_email(to_email, full_name, reset_link):
    EMAIL_ADDRESS = current_app.config['MAIL_USERNAME']
    EMAIL_PASSWORD = current_app.config['MAIL_PASSWORD']

    msg = EmailMessage()
    msg['Subject'] = 'הגדרת סיסמה למערכת TRIPLE'
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to_email

    msg.set_content(f"""שלום {full_name},

נוסף לך משתמש במערכת TRIPLE. אנא לחץ על הקישור הבא כדי להגדיר סיסמה:
{reset_link}

הקישור בתוקף למשך שעה בלבד.

בברכה,
צוות TRIPLE
""")

    with smtplib.SMTP_SSL(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT']) as smtp:
        smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        smtp.send_message(msg)


# מחיקת משתמש לפי ID
@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted successfully"})
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500

# פונקציה פנימית לפיצול שם מלא
def split_full_name(full_name):
    parts = full_name.split()
    if len(parts) >= 2:
        return parts[0], ' '.join(parts[1:])
    return full_name, ''

@users_bp.route('/reset_password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')  
    new_password = data.get('new_password')

    if not new_password:
        return jsonify({'error': 'Missing password'}), 400

    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 400
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'message': 'Password updated successfully'})

@users_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    current_user = User.query.get(get_jwt_identity())

    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    users = User.query.filter_by(business_id=current_user.business_id).all()
    return jsonify([
        {
            'id': u.id,
            'firstName': u.full_name.split()[0],
            'lastName': ' '.join(u.full_name.split()[1:]),
            'email': u.email,
            'phone': u.phone,
            'role': u.role
        } for u in users
    ])
