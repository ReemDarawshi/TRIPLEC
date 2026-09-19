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
from backend.helpers.creative_director import generate_creative_blueprints
from backend.helpers.html_poster_renderer import render_blueprint_poster


from backend.helpers.brand_display_name import get_brand_display_name

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

    business_name = get_brand_display_name(brand) or "העסק"
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
כל 3 ההצעות חייבות להיכתב בשפה המועדפת הזו בלבד.

אם השפה המועדפת היא ערבית:
- כתוב את כל ההצעות בערבית טבעית.
- אל תתרגם לעברית.
- אל תערבב עברית וערבית.

אם השפה המועדפת היא עברית:
- כתוב בעברית טבעית בלבד.

אם השפה המועדפת היא אנגלית:
- כתוב באנגלית טבעית בלבד.

השפה של ההוראות בפרומפט אינה קובעת את שפת התוצאה.
רק "השפה המועדפת" של העסק קובעת.

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

def generate_campaign_text(prompt, brand, campaign):
    business_name = get_brand_display_name(brand) or "העסק"
    business_description = brand.description or ""
    location = brand.location or ""

    business_category = brand.business_category or ""
    target_audience = brand.target_audience or ""
    tone_of_voice = brand.tone_of_voice or ""
    unique_value_proposition = (
        brand.unique_value_proposition or ""
    )
    main_products_services = (
        brand.main_products_services or ""
    )
    preferred_language = (
        brand.preferred_language or "עברית"
    )
    preferred_cta = brand.preferred_cta or ""
    preferred_phrases = brand.preferred_phrases or ""
    avoid_phrases = brand.avoid_phrases or ""

    campaign_type = campaign.type or "קמפיין"

    audience_roles = parse_campaign_json(
        campaign.target_roles
    )

    audience_groups = parse_campaign_json(
        campaign.target_groups
    )

    audience_desc_parts = []

    if audience_roles:
        audience_desc_parts.append(
            "Roles: " + ", ".join(
                str(role)
                for role in audience_roles
            )
        )

    if audience_groups:
        audience_desc_parts.append(
            "Groups: " + ", ".join(
                str(group)
                for group in audience_groups
            )
        )

    audience_desc = (
        " | ".join(audience_desc_parts)
        if audience_desc_parts
        else "General customers"
    )

    full_prompt = f"""
    
You are writing marketing copy for a campaign
inside the TRIPLE marketing platform.

==================================================
MANDATORY OUTPUT LANGUAGE
==================================================

Preferred language:
{preferred_language}

This is mandatory.

All 3 marketing texts MUST be written entirely
in the preferred language.

Important:
- Do not choose the language based on the language
  used in these instructions.
- Do not choose the language based on the campaign brief.
- Do not switch languages because previous content
  was written in another language.
- Do not mix languages unless the official business name
  itself contains another language.
- Hebrew and Arabic must sound natural and native,
  not like literal translations.

==================================================
BUSINESS
==================================================

Business name:
{business_name}

Business description:
{business_description}

Business category:
{business_category}

Location:
{location}

General target audience:
{target_audience}

Tone of voice:
{tone_of_voice}

Main products/services:
{main_products_services}

Unique value proposition:
{unique_value_proposition}

Preferred CTA:
{preferred_cta}

Preferred words/phrases:
{preferred_phrases}

Words/phrases to avoid:
{avoid_phrases}

==================================================
CAMPAIGN
==================================================

Campaign name:
{campaign.name or ""}

Campaign objective:
{campaign_type}

Actual campaign audience:
{audience_desc}

Approved campaign brief:
{prompt}

==================================================
TASK
==================================================

Create exactly 3 different short marketing texts.

Each text must:
- be suitable for Email or WhatsApp
- be concise and persuasive
- sound natural for this specific business
- follow the brand tone
- relate directly to the campaign brief
- use the preferred CTA when appropriate
- avoid forbidden phrases
- not invent prices, discounts, products,
  locations, events or business facts
- not be a variation of the same sentence

Return JSON only in this exact structure:

{{
  "texts": [
    "text 1",
    "text 2",
    "text 3"
  ]
}}
"""

    try:
        print(
            "Preferred AI language:",
            preferred_language
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert native multilingual advertising copywriter. "
                        "Write original marketing copy, never literal translations. "
                        "Always obey the business preferred language. "
                        "Preserve the official business name exactly. "
                        "Never invent business facts. "
                        + (
                            "For Arabic, write fluent, natural, contemporary Arabic "
                            "suitable for real marketing communication. "
                            "Use clear, approachable Modern Standard Arabic, "
                            "not stiff literary language or translated Hebrew phrasing. "
                            "Use natural Arabic sentence structures and idiomatic expressions. "
                            "Avoid generic advertising clichés, exaggerated promises, "
                            "awkward wording and unnecessary foreign terms. "
                            "Keep sentences short, appealing and culturally appropriate. "
                            "Write as a native Arabic copywriter would for this business. "
                            if str(preferred_language).strip().lower()
                            in ("ערבית", "arabic", "ar")
                            else ""
                        )
                    )
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            temperature=0.8,
            max_tokens=700,
            response_format={
                "type": "json_object"
            }
        )

        raw_result = (
            response
            .choices[0]
            .message
            .content
            .strip()
        )

        result = json.loads(raw_result)

        texts = result.get("texts", [])

        if not isinstance(texts, list):
            raise ValueError(
                "AI texts response is not a list"
            )

        texts = [
            text.strip()
            for text in texts
            if isinstance(text, str)
            and text.strip()
        ]

        if len(texts) != 3:
            raise ValueError(
                "AI must return exactly 3 texts"
            )

        return {
            "texts": texts
        }

    except Exception as e:
        print("OpenAI text generation error:", e)
        traceback.print_exc()
        raise

@ai_bp.route('/generate_posters', methods=['POST'])
@jwt_required()
def generate_posters_from_gallery_route():
    try:
        data = request.get_json() or {}

        campaign_id = data.get("campaign_id")
        selected_text = (data.get("selected_text") or "").strip()

        if not campaign_id:
            return jsonify({"error": "Missing campaign_id"}), 400

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

        # Only explicit user action can generate; reject empty text before any AI call.
        if current_user.role not in ("admin", "marketing"):
            return jsonify({"error": "Insufficient permissions"}), 403
        if campaign.status != "draft":
            return jsonify({"error": "Only draft campaigns can generate posters"}), 409
        if not selected_text:
            return jsonify({"error": "A selected text is required"}), 400
        if len(selected_text) > 10000:
            return jsonify({"error": "Selected text is too long"}), 400

        result = generate_creative_blueprints(
            client=client,
            brand=brand,
            campaign=campaign,
            selected_text=selected_text
        )

        blueprints = result.get("blueprints", [])

        posters = []

        for blueprint in blueprints:
            rendered = render_blueprint_poster(
                brand_settings=brand,
                blueprint=blueprint,
                campaign_id=campaign.campaign_id
            )

            posters.append({
                "id": blueprint.get("id"),
                "title": blueprint.get("headline", ""),
                "description": blueprint.get("art_direction", ""),
                "creative_type": blueprint.get("creative_type"),
                "creative_kind": blueprint.get("creative_kind"),
                "imageSrc": rendered["image_url"],
                "blueprint": blueprint
            })

        # Save only after all five files are successfully rendered. Previous
        # generation remains available if AI/rendering fails before this point.
        if len(posters) != 5:
            raise ValueError("Expected exactly five rendered posters")
        campaign.poster_options = {
            "selected_text": selected_text,
            "posters": [
                {
                    "id": item["id"],
                    "title": item["title"],
                    "description": item["description"],
                    "imageSrc": item["imageSrc"],
                    "creative_type": item["creative_type"],
                    "creative_kind": item["creative_kind"],
                }
                for item in posters
            ],
        }
        db.session.commit()
        return jsonify({
            "posters": posters
        }), 200

    except ValueError as e:
        db.session.rollback()
        print("Creative Director validation error:", e)

        return jsonify({
            "error": str(e)
        }), 400

    except Exception as e:
        db.session.rollback()
        print("Creative Director error:", e)
        traceback.print_exc()

        return jsonify({
            "error": "Failed to generate creative blueprints"
        }), 500