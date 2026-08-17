"""
קובץ זה הוא הקובץ הראשי של אפליקציית Flask.

הוא כולל:
- יצירת האפליקציה והגדרת הגדרות כלליות (CORS, JWT, משתני סביבה)
- חיבור למסד הנתונים עם SQLAlchemy
- רישום כל הנתיבים (Blueprints) של המערכת: התחברות, קבוצות, אנשי קשר, קמפיינים, הגדרות מותג, שליחה, בינה מלאכותית, משתמשים, פרופיל, ודשבורד
- יצירת תיקיית פוסטרים אם לא קיימת
- ראוט שמחזיר קבצי פוסטרים מהשרת
- הרצת השרת במצב debug בעת הפעלת הקובץ

שימושי במיוחד להפעלת השרת ולחיבור כל חלקי המערכת במקום אחד.
"""

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from backend.models.models import db
from backend.routes.auth_routes import auth_bp
from backend.routes.groups_routes import groups_bp
from backend.routes.brand_settings_routes import brand_settings_bp
from backend.routes.delivery_routes import delivery_bp
from backend.routes.campaign_routes import campaign_bp
from backend.routes.contacts import contacts_bp
from backend.routes.ai_routes import ai_bp
from backend.routes.upload_excel_routes import upload_excel_bp
from backend.routes.users_routes import users_bp
from backend.routes import profile_routes
from dotenv import load_dotenv
from backend.routes.dashboard_routes import dashboard_bp

import os

# טען משתני סביבה
load_dotenv()

#  הגדרת אפליקציה עם static_folder מדויק

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))#מגדיר את תיקיית השורש של המערכת
STATIC_DIR = os.path.join(BASE_DIR, 'static')#מגדיר את נתיב תיקיית הקבצים הסטטיים
app = Flask(__name__, static_folder=STATIC_DIR)#יוצר אפליקציה Flask עם נתיב סטטי מותאם

app.config.from_object('backend.config.Config')#טוען משתני סביבה וקונפיגורציה מהקובץ config
CORS(
    app,
    resources={
        r"/api/*": {"origins": "http://localhost:3000"},
        r"/static/fonts/*": {"origins": "http://localhost:3000"},
    },
    supports_credentials=True
)
# חיבור למסד נתונים
db.init_app(app)
jwt = JWTManager(app)

# יצירת תיקייה לפוסטרים אם לא קיימת
UPLOAD_FOLDER = os.path.join(STATIC_DIR, 'uploads', 'poster')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# רישום נתיבים
app.register_blueprint(auth_bp)
app.register_blueprint(groups_bp, url_prefix='/api/groups')
app.register_blueprint(brand_settings_bp)
app.register_blueprint(delivery_bp)
app.register_blueprint(campaign_bp, url_prefix='/api/campaigns')
app.register_blueprint(contacts_bp, url_prefix='/api/contacts')
app.register_blueprint(ai_bp)
app.register_blueprint(upload_excel_bp)
app.register_blueprint(users_bp)
app.register_blueprint(profile_routes.profile_bp)
app.register_blueprint(dashboard_bp)

# ברירת מחדל
@app.route('/')
def home():
    return 'שרת Flask פועל!'

#  הגשת פוסטרים מתיקיית static/uploads/poster
@app.route('/static/uploads/poster/<path:filename>')
def serve_poster(filename):
    poster_dir = os.path.join(app.static_folder, 'uploads', 'poster')
    return send_from_directory(poster_dir, filename)

# הגשת קבצים כלליים מתוך static/uploads/
@app.route('/static/uploads/<path:filename>')
def serve_uploads(filename):
    uploads_dir = os.path.join(app.static_folder, 'uploads')
    return send_from_directory(uploads_dir, filename)


# הרצת שרת
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    app.run(debug=True)
