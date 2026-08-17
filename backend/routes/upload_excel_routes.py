"""
ייבוא אנשי קשר מקובץ Excel.

בהעלאת קובץ:
1. מזהה את העסק לפי המשתמש המחובר ב-JWT.
2. יוצר אנשי קשר חדשים שאינם קיימים.
3. משתמש באנשי קשר קיימים במקום לשכפל אותם.
4. יוצר קבוצת יעד לפי שם קובץ ה-Excel.
5. אם הקבוצה כבר קיימת - משתמש בה.
6. משייך לקבוצה את כל אנשי הקשר שבקובץ.
"""

import os

import pandas as pd
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

from backend.models.models import (
    db,
    Contact,
    Group,
    ContactGroup,
    User,
)


upload_excel_bp = Blueprint(
    "upload_excel",
    __name__,
    url_prefix="/api/upload_excel"
)


@upload_excel_bp.route("", methods=["POST"])
@jwt_required()
def upload_excel():
    # ---------------------------------------------------------
    # 1. זיהוי המשתמש והעסק מתוך ה-JWT
    # ---------------------------------------------------------
    current_user = User.query.get(get_jwt_identity())

    if not current_user:
        return jsonify({"error": "Unauthorized"}), 403

    business_id = current_user.business_id

    # ---------------------------------------------------------
    # 2. בדיקת הקובץ
    # ---------------------------------------------------------
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]

    if not file or file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = file.filename.strip()

    if not filename.lower().endswith((".xls", ".xlsx")):
        return jsonify({
            "error": "Invalid file format. Only Excel files allowed"
        }), 400

    # שם הקבוצה = שם הקובץ ללא הסיומת
    group_name = os.path.splitext(os.path.basename(filename))[0].strip()

    if not group_name:
        return jsonify({"error": "Invalid file name"}), 400

    try:
        # ---------------------------------------------------------
        # 3. קריאת Excel
        # ---------------------------------------------------------
        df = pd.read_excel(file)

        required_columns = {
            "first_name",
            "last_name",
            "email",
            "phone",
        }

        missing_columns = required_columns - set(df.columns)

        if missing_columns:
            return jsonify({
                "error": (
                    "Missing required columns: "
                    + ", ".join(sorted(missing_columns))
                )
            }), 400

        # ---------------------------------------------------------
        # 4. יצירת הקבוצה או שימוש בקבוצה קיימת
        # ---------------------------------------------------------
        group = Group.query.filter_by(
            business_id=business_id,
            name=group_name
        ).first()

        group_created = False

        if not group:
            group = Group(
                name=group_name,
                description=f"קבוצה שנוצרה מייבוא הקובץ {filename}",
                color_class="pastel-blue",
                business_id=business_id,
            )

            db.session.add(group)
            db.session.flush()

            group_created = True

        # ---------------------------------------------------------
        # 5. מעבר על אנשי הקשר בקובץ
        # ---------------------------------------------------------
        created_contacts = 0
        existing_contacts = 0
        added_to_group = 0
        skipped_rows = 0

        # כדי למנוע טיפול כפול באותו אימייל בתוך אותו קובץ
        processed_emails = set()

        for _, row in df.iterrows():
            first_name = row.get("first_name")
            last_name = row.get("last_name")
            email = row.get("email")
            phone = row.get("phone")
            role = row.get("role")
            vip_value = row.get("vip", False)

            # ניקוי ערכים ריקים של Pandas
            if pd.isna(first_name):
                first_name = ""

            if pd.isna(last_name):
                last_name = ""

            if pd.isna(email):
                email = ""

            if pd.isna(phone):
                phone = ""

            if pd.isna(role):
                role = ""

            first_name = str(first_name).strip()
            last_name = str(last_name).strip()
            email = str(email).strip().lower()
            phone = str(phone).strip()
            role = str(role).strip()

            # כרגע אימייל נדרש לצורך זיהוי כפילויות
            if not email:
                skipped_rows += 1
                continue

            # אותה כתובת מופיעה יותר מפעם אחת באותו Excel
            if email in processed_emails:
                skipped_rows += 1
                continue

            processed_emails.add(email)

            # -----------------------------------------------------
            # 6. בדיקה האם איש הקשר כבר קיים אצל אותו עסק
            # -----------------------------------------------------
            contact = Contact.query.filter(
                Contact.business_id == business_id,
                db.func.lower(Contact.email) == email
            ).first()

            if contact:
                existing_contacts += 1

            else:
                # טיפול בסיסי בערך VIP
                if pd.isna(vip_value):
                    vip = False

                elif isinstance(vip_value, str):
                    vip = vip_value.strip().lower() in {
                        "true",
                        "1",
                        "yes",
                        "כן",
                    }

                else:
                    vip = bool(vip_value)

                contact = Contact(
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone=phone,
                    role=role,
                    vip=vip,
                    business_id=business_id,
                )

                db.session.add(contact)
                db.session.flush()

                created_contacts += 1

            # -----------------------------------------------------
            # 7. שיוך איש הקשר לקבוצה
            # -----------------------------------------------------
            existing_link = ContactGroup.query.filter_by(
                group_id=group.id,
                contact_id=contact.id
            ).first()

            if not existing_link:
                db.session.add(
                    ContactGroup(
                        group_id=group.id,
                        contact_id=contact.id
                    )
                )

                added_to_group += 1

        # ---------------------------------------------------------
        # 8. שמירה אחת בסוף
        # ---------------------------------------------------------
        db.session.commit()

        return jsonify({
            "message": "Contacts imported successfully",
            "group": {
                "id": group.id,
                "name": group.name,
                "created": group_created,
            },
            "summary": {
                "created_contacts": created_contacts,
                "existing_contacts": existing_contacts,
                "added_to_group": added_to_group,
                "skipped_rows": skipped_rows,
            },
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            "error": f"Database error: {str(e)}"
        }), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": f"Error processing file: {str(e)}"
        }), 500