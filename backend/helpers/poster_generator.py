from PIL import Image, ImageDraw, ImageFont
import os
import uuid
import json
from openai import OpenAI
from backend import config
import arabic_reshaper
from bidi.algorithm import get_display

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..')
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    'static',
    'uploads',
    'poster'
)

FONTS_FOLDER = 'static/fonts/'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DEFAULT_FONT = "Rubik"

FONT_MAPPING = {
    "Rubik": "Rubik-Regular.ttf",
    "Heebo": "Heebo-Regular.ttf",
    "Assistant": "Assistant-Regular.ttf",
    "Cairo": "Cairo-Regular.ttf",
    "Tajawal": "Tajawal-Regular.ttf",
    "Kufam": "Kufam-Regular.ttf",
    "Noto Sans Hebrew": "NotoSansHebrew-Regular.ttf",
    "Noto Sans Arabic": "NotoSansArabic-Regular.ttf",
    "Noto Sans": "NotoSans-Regular.ttf",
}

client = OpenAI(api_key=config.Config.OPENAI_API_KEY)


def get_font_path(font_name, preferred_language=None):
    if font_name in FONT_MAPPING:
        selected_font = font_name

    elif preferred_language:
        language = preferred_language.lower()

        if "arab" in language or "ערב" in language:
            selected_font = "Cairo"

        elif "hebrew" in language or "עבר" in language:
            selected_font = "Rubik"

        elif "english" in language or "אנגל" in language:
            selected_font = "Noto Sans"

        else:
            selected_font = DEFAULT_FONT

    else:
        selected_font = DEFAULT_FONT

    file_name = FONT_MAPPING[selected_font]

    return os.path.join(
        os.getcwd(),
        FONTS_FOLDER,
        file_name
    )

def generate_poster_headline(prompt, brand, campaign):
    full_prompt = f"""
צור כותרת שיווקית קצרה מאוד לפוסטר.

שם העסק:
{brand.business_name or ""}

תחום:
{brand.business_category or ""}

שם הקמפיין:
{campaign.name or ""}

מטרת הקמפיין:
{campaign.type or ""}

Brief:
{prompt or ""}

Tone:
{brand.tone_of_voice or ""}

שפה:
{brand.preferred_language or "עברית"}

כללים:
- 2 עד 6 מילים בלבד
- רעיון מרכזי אחד
- בלי הסברים
- בלי מרכאות
- בלי Markdown
- אל תמציא מבצע, מחיר או עובדה
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "אתה קופירייטר לפוסטרים נקיים ומינימליסטיים."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ],
        temperature=0.7,
        max_tokens=40
    )

    return response.choices[0].message.content.strip()

def prepare_text_for_language(text, preferred_language):
    language = (preferred_language or "").lower()

    # ערבית
    if "arab" in language or "ערב" in language:
        reshaped_text = arabic_reshaper.reshape(text)
        return get_display(reshaped_text)

    # עברית
    if "hebrew" in language or "עבר" in language:
        return get_display(text)

    # אנגלית ושאר השפות
    return text

def generate_posters_from_gallery(prompt, brand, campaign):
    print("[AI] generate_posters_from_gallery CALLED")


    # -----------------------------
    # 1. שליפת הגלריה
    # -----------------------------
    try:
        gallery_items = (
            json.loads(brand.gallery)
            if brand.gallery
            else []
        )

        if not gallery_items:
            print("No gallery items found.")
            return []

    except Exception as e:
        print(f"Error parsing gallery JSON: {e}")
        return []

    # -----------------------------
    # 2. לוגו
    # -----------------------------
    logo_paths = (
        brand.logos.split(",")
        if brand.logos
        else []
    )

    logo_path = (
        logo_paths[0].strip()
        if logo_paths
        else None
    )

    # -----------------------------
    # 3. צבעים ופונט
    # -----------------------------
    palette = (
        brand.palette.split(",")
        if brand.palette
        else ["#000000"]
    )

    font_title = (
        brand.font_title
        or DEFAULT_FONT
    )

    font_path = get_font_path(
    font_title,
    brand.preferred_language
)

    # -----------------------------
    # 4. דירוג תמונות לפי התאמה
    # -----------------------------
    def score_gallery_image(item):
        description = (
            item.get("description") or ""
        ).lower()

        prompt_text = (
            prompt or ""
        ).lower()

        campaign_name = (
            campaign.name or ""
        ).lower()

        campaign_type = (
            campaign.type or ""
        ).lower()

        score = 0

        # התאמה ל-Brief / Prompt
        for word in prompt_text.split():
            if len(word) > 2 and word in description:
                score += 3

        # התאמה לשם הקמפיין
        for word in campaign_name.split():
            if len(word) > 2 and word in description:
                score += 2

        # התאמה למטרת הקמפיין
        for word in campaign_type.split():
            if len(word) > 2 and word in description:
                score += 1

        return score

    selected_images = sorted(
        gallery_items,
        key=score_gallery_image,
        reverse=True
    )[:5]

    output_paths = []

    # -----------------------------
    # 5. יצירת הפוסטרים
    # -----------------------------
    for i, item in enumerate(selected_images):
        try:
            image_path = item.get("path")

            if not image_path:
                print("Gallery item without path - skipped.")
                continue

            full_image_path = os.path.join(
                BASE_DIR,
                image_path.lstrip("/")
            )

            if not os.path.exists(full_image_path):
                print(
                    f"Image does not exist: "
                    f"{full_image_path}"
                )
                continue

            print("Processing:", full_image_path)

            base_image = Image.open(
                full_image_path
            ).convert("RGBA")

            width, height = base_image.size

            draw = ImageDraw.Draw(base_image)

            # -----------------------------
            # 6. טקסט זמני לפוסטר
            # בהמשך נחליף ב-headline של AI
            # -----------------------------
            short_text = generate_poster_headline(
                prompt,
                brand,
                campaign
                )

            short_text = prepare_text_for_language(
            short_text,
            brand.preferred_language
            )

            # -----------------------------
            # 7. טעינת פונט
            # -----------------------------
            try:
                font = ImageFont.truetype(
                    font_path,
                    size=max(
                        24,
                        int(height * 0.05)
                    )
                )

            except Exception as font_err:
                print(
                    f"Error loading font "
                    f"{font_path}: {font_err}"
                )
                font = ImageFont.load_default()

            # -----------------------------
            # 8. מיקום קבוע ונקי לטקסט
            # -----------------------------
            text_x = 50
            text_y = 50

            text_color = (
                palette[i % len(palette)].strip()
                if palette
                else "#000000"
            )

            box_padding = 14

            text_bbox = draw.textbbox(
                (0, 0),
                short_text,
                font=font
            )

            box_width = (
                text_bbox[2]
                - text_bbox[0]
                + 2 * box_padding
            )

            box_height = (
                text_bbox[3]
                - text_bbox[1]
                + 2 * box_padding
            )

            box_pos = (
                text_x - box_padding,
                text_y - box_padding
            )

            overlay = Image.new(
                "RGBA",
                (box_width, box_height),
                (255, 255, 255, 215)
            )

            base_image.paste(
                overlay,
                box_pos,
                overlay
            )

            draw.text(
                (text_x, text_y),
                short_text,
                font=font,
                fill=text_color
            )

            # -----------------------------
            # 9. שילוב לוגו
            # -----------------------------
            if logo_path:
                logo_full_path = os.path.join(
                    BASE_DIR,
                    logo_path.lstrip("/")
                )

                if os.path.exists(logo_full_path):
                    logo = Image.open(
                        logo_full_path
                    ).convert("RGBA")

                    max_logo_size = int(
                        min(width, height) * 0.15
                    )

                    logo.thumbnail(
                        (
                            max_logo_size,
                            max_logo_size
                        )
                    )

                    logo_position = (
                        width - logo.width - 30,
                        30
                    )

                    base_image.paste(
                        logo,
                        logo_position,
                        logo
                    )

            # -----------------------------
            # 10. שמירת הפוסטר
            # -----------------------------
            unique_name = (
                f"poster_"
                f"{campaign.id}_"
                f"{i}_"
                f"{uuid.uuid4().hex}.png"
            )

            full_output_path = os.path.join(
                UPLOAD_FOLDER,
                unique_name
            )

            base_image.save(full_output_path)

            print(
                f"Poster saved: "
                f"{full_output_path}"
            )

            output_paths.append(
                f"/static/uploads/poster/"
                f"{unique_name}"
            )

        except Exception as e:
            print(
                f"Error generating poster: {e}"
            )
            continue

    return output_paths