#  בינה מלאכותית קובץ זה אחראי על פעולות הבינה המלאכותית במערכת כולל יצירת טקסטים שיווקיים עם ויצירת פוסטרים מעוצבים מהגלריה.
# הוא משתמש בפרטי הקמפיין והמותג ליצירת תוכן מותאם אישית: 3 טקסטים קצרים ודינמיים ו־5 עיצובים גרפיים לפוסטרים.
# מכיל 2 ראוטים: /ai/texts ל־GPT ו־/generate_posters ליצירת תמונות בפועל על בסיס תמונות מותג.


from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import db, Campaign, BrandSettings, User, Group
from openai import OpenAI  
import json
from backend import config
from PIL import Image, ImageDraw, ImageFont
from backend.helpers.poster_generator import generate_posters_from_gallery  
import traceback

client = OpenAI(api_key=config.Config.OPENAI_API_KEY)

ai_bp = Blueprint('ai_bp', __name__, url_prefix="/api")
def parse_campaign_json(value):
    """
    Temporary compatibility helper.

    Campaign.target_groups and Campaign.target_roles are db.JSON fields,
    but existing campaigns may contain JSON strings because older code
    used json.dumps() before saving them.

    This helper supports both formats until we migrate the old data.
    """
    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, str):
        try:
            parsed = json.loads(value)

            if isinstance(parsed, list):
                return parsed

            return []
        except (json.JSONDecodeError, TypeError):
            return []

    return []


@ai_bp.route('/ai/prompt-suggestions', methods=['POST'])
@jwt_required()
def generate_prompt_suggestions():
    data = request.get_json() or {}
    campaign_id = data.get("campaign_id")

    if not campaign_id:
        return jsonify({"error": "Missing campaign_id"}), 400

    # המשתמש המחובר
    current_user = User.query.get(get_jwt_identity())

    if not current_user:
        return jsonify({"error": "Unauthorized"}), 403

    # שליפת הקמפיין רק אם הוא שייך לעסק של המשתמש המחובר
    campaign = Campaign.query.filter_by(
        campaign_id=campaign_id,
        business_id=current_user.business_id
    ).first()

    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    # הגדרות המותג חייבות להיות של אותו עסק
    brand = BrandSettings.query.filter_by(
        business_id=current_user.business_id
    ).first()

    if not brand:
        return jsonify({"error": "Brand settings not found"}), 404

    # תמיכה זמנית גם בקמפיינים הישנים שנשמרו כ-JSON string
    target_roles = parse_campaign_json(campaign.target_roles)
    target_group_ids = parse_campaign_json(campaign.target_groups)

    # המרת IDs של קבוצות לשמות בעלי משמעות שיווקית
    group_names = []

    if target_group_ids:
        groups = Group.query.filter(
            Group.business_id == current_user.business_id,
            Group.id.in_(target_group_ids)
        ).all()

        group_names = [group.name for group in groups]

    roles_text = ", ".join(target_roles) if target_roles else "לא נבחרו תפקידים"
    groups_text = ", ".join(group_names) if group_names else "לא נבחרו קבוצות"

    business_name = brand.business_name or "העסק"
    business_category = brand.business_category or "לא הוגדר"
    business_description = brand.description or "לא הוגדר"
    location = brand.location or "לא הוגדר"

    general_target_audience = brand.target_audience or "לא הוגדר"
    tone_of_voice = brand.tone_of_voice or "טון טבעי המתאים לעסק"
    unique_value_proposition = brand.unique_value_proposition or "לא הוגדר"
    main_products_services = brand.main_products_services or "לא הוגדר"
    marketing_goals = brand.marketing_goals or "לא הוגדר"
    preferred_language = brand.preferred_language or "עברית"
    preferred_cta = brand.preferred_cta or "לא הוגדר"
    preferred_phrases = brand.preferred_phrases or "לא הוגדר"
    avoid_phrases = brand.avoid_phrases or "לא הוגדר"

    campaign_name = campaign.name or "קמפיין"
    campaign_objective = campaign.type or "לא הוגדרה מטרה"

    ai_prompt = f"""
אתה משמש כיועץ שיווק חכם בתוך מערכת TRIPLE.

המטרה שלך כרגע אינה לכתוב את הקמפיין עצמו.
המטרה שלך היא להציע למשתמש 3 רעיונות שונים ל-Brief שהוא יכול לבחור,
לערוך, ואז להשתמש בו כדי ליצור את הקמפיין.

חשוב מאוד:
שלוש ההצעות חייבות להיות שונות זו מזו מבחינה אסטרטגית,
ולא שלושה ניסוחים דומים של אותו רעיון.

====================
פרטי העסק
====================

שם העסק:
{business_name}

תחום העסק:
{business_category}

תיאור העסק:
{business_description}

מיקום:
{location}

מוצרים / שירותים מרכזיים:
{main_products_services}

הצעת הערך הייחודית של העסק:
{unique_value_proposition}

====================
הקשר שיווקי של המותג
====================

קהל היעד הכללי של העסק:
{general_target_audience}

מטרות שיווקיות כלליות:
{marketing_goals}

Tone of Voice:
{tone_of_voice}

שפה מועדפת:
{preferred_language}

CTA מועדף:
{preferred_cta}

ביטויים שהעסק אוהב להשתמש בהם:
{preferred_phrases}

ביטויים שיש להימנע מהם:
{avoid_phrases}

====================
הקמפיין הנוכחי
====================

שם הקמפיין:
{campaign_name}

מטרת הקמפיין:
{campaign_objective}

תפקידי הנמענים שנבחרו:
{roles_text}

קבוצות הנמענים שנבחרו:
{groups_text}

====================
המשימה
====================

צור בדיוק 3 הצעות Brief שונות לקמפיין.

הצעה 1:
התמקדות בחוויה, רגש או החיבור שהלקוח אמור להרגיש.

הצעה 2:
התמקדות בערך, הצעה מסחרית או הנעה ברורה לפעולה.

הצעה 3:
התמקדות בבידול של העסק, בתועלת ללקוח או בזווית שיווקית אחרת
שמתאימה במיוחד לעסק ולקהל שנבחר.

כל הצעה צריכה:
- להיות קצרה וברורה.
- להישמע כאילו בעל העסק מסביר ל-TRIPLE מה הוא רוצה להשיג.
- להתאים לעסק הספציפי ולא להיות Generic.
- להתחשב במטרת הקמפיין.
- להתחשב בקהל הנבחר.
- להתאים לטון ולשפה של המותג.
- להשתמש ב-CTA ובביטויים המועדפים רק כאשר זה טבעי.
- לא להשתמש בביטויים שהעסק ביקש להימנע מהם.
- לא להמציא מבצעים, מחירים, אחוזי הנחה, מוצרים או עובדות שלא ניתנו.
- לא להבטיח דבר שאינו מופיע במידע שסופק.

החזר JSON בלבד בפורמט הבא:

{{
  "suggestions": [
    "הצעה ראשונה",
    "הצעה שנייה",
    "הצעה שלישית"
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "אתה יועץ שיווק מקצועי. "
                        "אתה מנתח את העסק, הקהל והמטרה לפני שאתה מציע רעיונות. "
                        "אל תמציא מידע עסקי שלא סופק."
                    )
                },
                {
                    "role": "user",
                    "content": ai_prompt
                }
            ],
            temperature=0.8,
            max_tokens=700
        )

        raw_result = response.choices[0].message.content.strip()

        # הסרת markdown fences במקרה שהמודל החזיר ```json
        if raw_result.startswith("```"):
            raw_result = raw_result.replace("```json", "").replace("```", "").strip()

        result = json.loads(raw_result)

        suggestions = result.get("suggestions", [])

        if not isinstance(suggestions, list):
            return jsonify({
                "error": "Invalid AI response format"
            }), 500

        suggestions = [
            suggestion.strip()
            for suggestion in suggestions
            if isinstance(suggestion, str) and suggestion.strip()
        ]

        if len(suggestions) != 3:
            return jsonify({
                "error": "AI did not return exactly 3 suggestions"
            }), 500

        return jsonify({
            "suggestions": suggestions
        }), 200

    except json.JSONDecodeError as e:
        print("Prompt suggestions JSON error:", e)
        print("Raw AI result:", raw_result if 'raw_result' in locals() else "")
        return jsonify({
            "error": "AI returned an invalid response format"
        }), 500

    except Exception as e:
        print("Prompt suggestions error:", e)
        traceback.print_exc()

        return jsonify({
            "error": "Failed to generate prompt suggestions"
        }), 500

# מחולל טקסטים בהתבסס על Prompt + פרטי העסק מתוך BrandSettings
@ai_bp.route('/ai/texts', methods=['POST'])
@jwt_required()
def generate_ai_texts():
    data = request.get_json() or {}

    campaign_id = data.get("campaign_id")
    prompt = (data.get("prompt") or "").strip()

    if not campaign_id:
        return jsonify({"error": "Missing campaign_id"}), 400

    if not prompt:
        return jsonify({"error": "Campaign brief is required"}), 400

    current_user = User.query.get(get_jwt_identity())

    if not current_user:
        return jsonify({"error": "Unauthorized"}), 403

    campaign = Campaign.query.filter_by(
        campaign_id=campaign_id,
        business_id=current_user.business_id
    ).first()

    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    brand = BrandSettings.query.filter_by(
        business_id=current_user.business_id
    ).first()

    if not brand:
        return jsonify({"error": "Brand settings not found"}), 404

    try:
        # שמירת ה-Brief שאושר
        campaign.ai_prompt = prompt
        db.session.commit()

        # יצירת 3 הטקסטים
        result = generate_campaign_text(
            prompt=prompt,
            brand=brand,
            campaign=campaign
        )

        # שמירת 3 הטקסטים ב-DB
        campaign.ai_text_options = result["texts"]
        db.session.commit()

        return jsonify({
            "texts": result["texts"]
        }), 200

    except Exception as e:
        db.session.rollback()
        print("AI texts error:", e)
        traceback.print_exc()

        return jsonify({
            "error": "Failed to generate campaign texts"
        }), 500

# GPT Generator – מקבל רק Prompt מהמשתמש + שואב את כל שאר המידע מתוך BrandSettings
def generate_campaign_text(prompt, brand, campaign):
    business_name = brand.business_name or "העסק שלך"
    business_description = brand.description or ""
    location = brand.location or ""
    primary_color = brand.primary_color or ""
    font_title = brand.font_title or ""

    campaign_type = campaign.type or "קמפיין"
    audience_roles = json.loads(campaign.target_roles or "[]")
    audience_groups = json.loads(campaign.target_groups or "[]")

    # בניית תיאור קהל יעד
    audience_desc = ""
    if audience_roles:
        audience_desc += " לפי תפקידים: " + ", ".join(audience_roles)
    if audience_groups:
        audience_desc += " לפי קבוצות: " + ", ".join(str(g) for g in audience_groups)

    # יצירת הפרומפט
    full_prompt = (
        f"אתה כותב טקסטים שיווקיים עבור קמפיינים לעסקים קטנים בישראל. "
        f"העסק נקרא: {business_name}. "
        f"התיאור שלו: {business_description}. "
        f"מיקום: {location if location else 'לא צויין'}. "
        f"צבע ראשי למיתוג: {primary_color}. "
        f"שם קמפיין: {campaign.name}. "
        f"סוג קמפיין: {campaign_type}. "
        f"קהל יעד: {audience_desc if audience_desc else 'לקוחות כלליים'}. "
        f"הנה רעיון הקמפיין שהוזן ע״י המשתמש: {prompt} "
        f"בהתאם לכך צור 3 טקסטים קצרים, משכנעים, קלילים, רלוונטיים לשליחה באימייל או וואטסאפ. "
        f"כל טקסט צריך להיות בפסקה אחת לא יותר מדי רשמי, אבל עדיין מייצג את העסק. "
        f"תוכל לשלב שם העסק בצורה יצירתית אם זה מתאים."
    )

    try:
        print(" Full prompt sent to OpenAI:\n", full_prompt)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "אתה יועץ שיווק בעברית. תכתוב טקסטים קצרים לקמפיינים בצורה מעניינת ויצירתית."},
                {"role": "user", "content": full_prompt}
            ],
            temperature=0.75,
            max_tokens=500
        )

        result = response.choices[0].message.content.strip()
        texts = [line.strip("-•123. ").strip() for line in result.split("\n") if line.strip()]
        texts = [t for t in texts if len(t) > 10]

        return {"texts": texts[:3]}

    except Exception as e:
        print(" OpenAI Error:", e)
        import traceback
        traceback.print_exc()

        return {
            "texts": [
                "⚠️ הייתה שגיאה ביצירת הטקסט. נסי שוב מאוחר יותר.",
                "🚧 אנחנו עובדים על שיפור המערכת.",
                "💡 ניתן להזין טקסט ידנית בינתיים."
            ]
        }

@ai_bp.route('/generate_posters', methods=['POST'])
@jwt_required()
def generate_posters_from_gallery_route():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        campaign_id = int(data.get("campaign_id", 0))

        campaign = Campaign.query.get(campaign_id)
        if not campaign:
            return jsonify({"error": "Campaign not found"}), 404

        brand = BrandSettings.query.filter_by(business_id=campaign.business_id).first()
        if not brand:
            return jsonify({"error": "Brand settings not found"}), 404

        poster_paths = generate_posters_from_gallery(prompt, brand, campaign)

        poster_list = []
        for i, path in enumerate(poster_paths):
            poster_list.append({
                "id": f"p{i+1}",
                "imageSrc": path,
                "title": f"עיצוב {i+1}",
                "description": campaign.name
            })

        return jsonify({"posters": poster_list}), 200

    except Exception as e:
        print(" Poster generation error:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
