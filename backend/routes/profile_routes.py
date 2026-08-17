"""
 קובץ זה מטפל בניהול הפרופיל האישי של המשתמש במערכת TRIPLE.

הקובץ כולל שלושה מסלולים (routes) עיקריים:

🔹 קבלת פרטי המשתמש המחובר — מחזיר את שם המשתמש, מייל, טלפון ותפקיד.
🔹 עדכון פרטי פרופיל — מאפשר למשתמש לעדכן את השם המלא ואת מספר הטלפון.
🔹 שינוי סיסמה — בודק שהסיסמה הנוכחית תקינה ומעדכן לסיסמה חדשה.

כל הפעולות דורשות אימות באמצעות JWT כדי לוודא שהמשתמש מחובר ומורשה.
"""

from flask import Blueprint, request, jsonify
from backend.models.models import db, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

# קבלת פרטי המשתמש המחובר
@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'firstName': user.full_name.split()[0] if user.full_name else '',
        'lastName': user.full_name.split()[1] if user.full_name and len(user.full_name.split()) > 1 else '',
        'email': user.email,
        'phone': user.phone,
        'role': user.role
    })

# עדכון פרטי פרופיל (שם וטלפון)
@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    phone = data.get('phone')

    user.full_name = f"{first_name} {last_name}".strip()
    user.phone = phone
    db.session.commit()

    return jsonify({'message': 'Profile updated successfully'})

# שינוי סיסמה
@profile_bp.route('/change_password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

   
    current_password = data.get('current_password')  
    new_password = data.get('new_password')

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({'error': 'סיסמה נוכחית שגויה'}), 400

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'})
