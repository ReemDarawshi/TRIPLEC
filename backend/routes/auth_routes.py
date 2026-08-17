from backend.models.models import db, User
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Blueprint, request, jsonify, current_app
from backend.email_sender import send_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = jwt.encode({
    'sub': str(user.id),
    'role': user.role,
    'business_id': user.business_id,  
    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')


    return jsonify({
    'token': token,
    'user': {
        'id': user.id,
        'full_name': user.full_name,
        'email': user.email,
        'role': user.role,
        'business_id': user.business_id  
    }
})
def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@auth_bp.route('/reset_password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()

        return jsonify({"message": "Password reset successful"})

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 400
    except Exception as e:
        print(f"שגיאה באיפוס סיסמה: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/register_admin', methods=['POST'])
def register_admin():
    data = request.get_json()
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'Admin')
    admin_secret = data.get('admin_secret')

    # אימות סיסמה פנימית של צוות 
    if admin_secret != current_app.config.get('ADMIN_SECRET', 'TRIPLE2025'):
        return jsonify({'error': 'Unauthorized'}), 403

    # בדיקה אם כבר קיים משתמש כזה
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    # יצירת יוזר חדש
    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
        business_id=1  
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Admin user registered successfully ✅'}), 201


@auth_bp.route('/forgot_password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'חסר מייל'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'משתמש לא נמצא'}), 404

    token = jwt.encode(
        {
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        },
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    reset_link = f"http://localhost:5173/reset-password?token={token}"

    subject = "איפוס סיסמה"
    body = f"""
    שלום {user.full_name},

    התקבלה בקשה לאיפוס סיסמה למערכת TRIPLE.

    ניתן לאפס את הסיסמה על ידי לחיצה על הקישור הבא:
    {reset_link}

    אם לא ביקשת איפוס – פשוט התעלם מהודעה זו.

    בברכה,
    צוות TRIPLE
    """
    send_email(to=email, subject=subject, body=body)
    return jsonify({'message': 'קישור איפוס נשלח למייל 📧'}), 200
