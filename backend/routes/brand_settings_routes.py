from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from backend.models.models import db, BrandSettings, User
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import json

brand_settings_bp = Blueprint('brand_settings', __name__, url_prefix='/api/brand-settings')

# נתיב לתיקיית העלאות
UPLOAD_DIR = os.path.join('static', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# פונקציית עזר לשמירת קובץ

def save_uploaded_file(file):
    if not file:
        return None
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_DIR, filename)
    file.save(filepath)
    return f'/static/uploads/{filename}'

# פונקציית עזר למחיקת קובץ מהשרת

def delete_file(path_from_static):
    try:
        full_path = os.path.join(current_app.root_path, path_from_static.lstrip('/'))
        if os.path.exists(full_path):
            os.remove(full_path)
    except Exception as e:
        print(f"שגיאה במחיקת קובץ: {e}")

# POST / PUT: שמירת הגדרות המותג
@brand_settings_bp.route('', methods=['POST', 'PUT'])
@jwt_required()
def save_brand_settings():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.form
    files = request.files

    business_name = data.get('businessName')
    description = data.get('description')
    primary_color = data.get('primaryColor')
    palette = data.get('palette')
    font_title = data.get('fontTitle')
    font_subtitle = data.get('fontSubtitle')
    font_paragraph = data.get('fontParagraph')
    location = data.get('location')
    business_category = data.get('businessCategory')
    target_audience = data.get('targetAudience')
    tone_of_voice = data.get('toneOfVoice')
    unique_value_proposition = data.get('uniqueValueProposition')
    main_products_services = data.get('mainProductsServices')
    marketing_goals = data.get('marketingGoals')
    preferred_language = data.get('preferredLanguage')
    preferred_cta = data.get('preferredCta')
    preferred_phrases = data.get('preferredPhrases')
    avoid_phrases = data.get('avoidPhrases')

    main_image = save_uploaded_file(files.get('main_image'))
    logo_files = files.getlist('logos')
    gallery_files = files.getlist('gallery')

    settings = BrandSettings.query.filter_by(business_id=user.business_id).first()
    if not settings:
        settings = BrandSettings(business_id=user.business_id)
        db.session.add(settings)

    settings.business_name = business_name
    settings.description = description
    settings.primary_color = primary_color
    settings.palette = palette
    settings.font_title = font_title
    settings.font_subtitle = font_subtitle
    settings.font_paragraph = font_paragraph
    settings.location = location
    settings.business_category = business_category
    settings.target_audience = target_audience
    settings.tone_of_voice = tone_of_voice
    settings.unique_value_proposition = unique_value_proposition
    settings.main_products_services = main_products_services
    settings.marketing_goals = marketing_goals
    settings.preferred_language = preferred_language
    settings.preferred_cta = preferred_cta
    settings.preferred_phrases = preferred_phrases
    settings.avoid_phrases = avoid_phrases

    if main_image:
        settings.main_image = main_image

    existing_logos = settings.logos.split(',') if settings.logos else []
    new_logos = [save_uploaded_file(f) for f in logo_files if f]
    settings.logos = ",".join(existing_logos + new_logos)

    existing_gallery = json.loads(settings.gallery) if settings.gallery else []
    for i, file in enumerate(gallery_files):
        path = save_uploaded_file(file)
        desc_key = f'desc_{i}'
        image_desc = data.get(desc_key, '')
        if path:
            existing_gallery.append({'path': path, 'description': image_desc})
    settings.gallery = json.dumps(existing_gallery, ensure_ascii=False)

    db.session.commit()
    return jsonify({'message': 'Brand settings saved successfully'}), 201

# GET: שליפת הגדרות המותג
@brand_settings_bp.route('', methods=['GET'])
@jwt_required()
def get_settings():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    settings = BrandSettings.query.filter_by(business_id=user.business_id).first()
    if not settings:
        return jsonify({'error': 'No settings found'}), 404

    return jsonify({
        'businessName': settings.business_name,
        'description': settings.description,
        'mainImage': settings.main_image,
        'logos': settings.logos.split(',') if settings.logos else [],
        'gallery': [item for item in json.loads(settings.gallery)
        if not item.get("path", "").startswith("/static/uploads/poster/")
        ] if settings.gallery else [],
        'primaryColor': settings.primary_color,
        'palette': settings.palette.split(',') if settings.palette else [],
        'fontTitle': settings.font_title,
        'fontSubtitle': settings.font_subtitle,
        'fontParagraph': settings.font_paragraph,
        'location': settings.location,
        'businessCategory': settings.business_category,
        'targetAudience': settings.target_audience,
        'toneOfVoice': settings.tone_of_voice,
        'uniqueValueProposition': settings.unique_value_proposition,
        'mainProductsServices': settings.main_products_services,
        'marketingGoals': settings.marketing_goals,
        'preferredLanguage': settings.preferred_language,
        'preferredCta': settings.preferred_cta,
        'preferredPhrases': settings.preferred_phrases,
        'avoidPhrases': settings.avoid_phrases

    })

# DELETE: מחיקת לוגו לפי אינדקס
@brand_settings_bp.route('/logo/<int:index>', methods=['DELETE'])
@jwt_required()
def delete_logo(index):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    settings = BrandSettings.query.filter_by(business_id=user.business_id).first()
    if not settings or not settings.logos:
        return jsonify({'error': 'Settings or logos not found'}), 404

    logos = settings.logos.split(',')
    if index < 0 or index >= len(logos):
        return jsonify({'error': 'Invalid index'}), 400

    delete_file(logos[index])
    del logos[index]
    settings.logos = ",".join(logos)
    db.session.commit()

    return jsonify({'message': 'Logo deleted', 'logos': logos})

# DELETE: מחיקת פריט מהגלריה לפי אינדקס
@brand_settings_bp.route('/gallery/<int:index>', methods=['DELETE'])
@jwt_required()
def delete_gallery_image(index):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    settings = BrandSettings.query.filter_by(business_id=user.business_id).first()
    if not settings or not settings.gallery:
        return jsonify({'error': 'Settings or gallery not found'}), 404

    gallery = json.loads(settings.gallery)
    if index < 0 or index >= len(gallery):
        return jsonify({'error': 'Invalid index'}), 400

    delete_file(gallery[index]['path'])
    del gallery[index]
    settings.gallery = json.dumps(gallery, ensure_ascii=False)
    db.session.commit()

    return jsonify({'message': 'Gallery image deleted', 'gallery': gallery})

# DELETE: מחיקת תמונה ראשית
@brand_settings_bp.route('/main-image', methods=['DELETE'])
@jwt_required()
def delete_main_image():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    settings = BrandSettings.query.filter_by(business_id=user.business_id).first()
    if not settings or not settings.main_image:
        return jsonify({'error': 'Main image not found'}), 404

    delete_file(settings.main_image)
    settings.main_image = None
    db.session.commit()

    return jsonify({'message': 'Main image deleted', 'mainImage': None})
