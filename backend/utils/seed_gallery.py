import os
import json
from backend.models.models import db, BrandSettings
from backend.app import app

UPLOADS_FOLDER = "static/uploads"

def seed_gallery_for_brand(business_id):
    with app.app_context():
        brand = BrandSettings.query.filter_by(business_id=business_id).first()
        if not brand:
            print("לא נמצא מותג לעסק")
            return

        if brand.gallery:
            print("💡 כבר קיימת גלריה – לא מעדכן")
            return

        gallery_items = []
        for filename in os.listdir(UPLOADS_FOLDER):
            if filename.lower().endswith((".jpg", ".jpeg", ".png")):
                path = f"/static/uploads/{filename}"
                gallery_items.append({
                    "path": path,
                    "description": filename.split(".")[0]  # שם פשוט בלי סיומת
                })

        if not gallery_items:
            print("⚠️ לא נמצאו קבצים בתיקיית uploads")
            return

        brand.gallery = json.dumps(gallery_items, ensure_ascii=False)
        db.session.commit()
        print(f" נוספה גלריה ל־Brand ID {brand.id} ({brand.business_name})")

if __name__ == "__main__":
    seed_gallery_for_brand(business_id=1)  # עדכן למזהה המתאים
