import os
import html
import json
import base64
import mimetypes

from playwright.sync_api import sync_playwright


BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "static",
    "uploads",
    "poster_html"
)

FONTS_DIR = os.path.join(
    BASE_DIR,
    "static",
    "fonts"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


FONT_FILES = {
    "Rubik": "Rubik-Bold.ttf",
    "Heebo": "Heebo-Bold.ttf",
    "Assistant": "Assistant-Bold.ttf",
    "Cairo": "Cairo-Bold.ttf",
    "Tajawal": "Tajawal-Bold.ttf",
    "Kufam": "Kufam-Bold.ttf",
    "Noto Sans": "NotoSans-Bold.ttf",
    "Noto Sans Hebrew": "NotoSansHebrew-Bold.ttf",
    "Noto Sans Arabic": "NotoSansArabic-Bold.ttf",
    "Arima Variable": "Arima-VariableFont_wght.ttf",
    "Borel": "Borel-Regular.ttf",
    "Rubik Gemstones": "RubikGemstones-Regular.ttf",
}


def _safe(value):
    return html.escape(str(value or ""))


def _resolve_static_path(path):
    if not path:
        return None

    clean_path = str(path).replace("\\", "/")

    if clean_path.startswith("/"):
        clean_path = clean_path[1:]

    full_path = os.path.abspath(
        os.path.join(BASE_DIR, clean_path)
    )

    if not os.path.exists(full_path):
        return None

    return full_path


def _file_to_data_uri(path):
    if not path or not os.path.exists(path):
        return ""

    mime_type, _ = mimetypes.guess_type(path)

    if not mime_type:
        mime_type = "application/octet-stream"

    with open(path, "rb") as file:
        encoded = base64.b64encode(
            file.read()
        ).decode("utf-8")

    return f"data:{mime_type};base64,{encoded}"


def _font_data_uri(font_family):
    filename = FONT_FILES.get(font_family)

    if not filename:
        return "", "Arial"

    path = os.path.join(
        FONTS_DIR,
        filename
    )

    if not os.path.exists(path):
        return "", "Arial"

    return _file_to_data_uri(path), font_family


def _parse_palette(value):
    if not value:
        return []

    if isinstance(value, list):
        return [
            str(item).strip()
            for item in value
            if str(item).strip()
        ]

    return [
        item.strip()
        for item in str(value).split(",")
        if item.strip()
    ]


def _parse_logos(value):
    if not value:
        return []

    if isinstance(value, list):
        return value

    return [
        item.strip()
        for item in str(value).split(",")
        if item.strip()
    ]


def _parse_gallery(value):
    if not value:
        return []

    if isinstance(value, list):
        return value

    try:
        parsed = json.loads(value)

        if isinstance(parsed, list):
            return parsed

    except (json.JSONDecodeError, TypeError):
        pass

    return []


def _direction_from_language(language):
    value = str(language or "").lower().strip()

    ltr_values = [
        "english",
        "en",
        "אנגלית"
    ]

    if value in ltr_values:
        return "ltr"

    return "rtl"


def _default_font_for_language(language):
    value = str(language or "").lower()

    if (
        "arab" in value
        or "ערב" in value
        or value == "ar"
    ):
        return "Cairo"

    if (
        "english" in value
        or "אנגלית" in value
        or value == "en"
    ):
        return "Noto Sans"

    return "Rubik"


def _darken_hex(color, factor=0.42):
    if not color:
        return "#111827"

    color = color.strip()

    if not color.startswith("#"):
        return "#111827"

    value = color[1:]

    if len(value) == 3:
        value = "".join(
            char * 2
            for char in value
        )

    if len(value) != 6:
        return "#111827"

    try:
        red = int(value[0:2], 16)
        green = int(value[2:4], 16)
        blue = int(value[4:6], 16)

        red = int(red * factor)
        green = int(green * factor)
        blue = int(blue * factor)

        return f"#{red:02x}{green:02x}{blue:02x}"

    except ValueError:
        return "#111827"


def render_poster(
    headline,
    subheadline="",
    cta="",
    primary_color="#355c4d",
    secondary_color=None,
    direction="rtl",
    output_name="poster.png",
    layout="minimal_center",
    logo_path=None,
    business_name="",
    background_image_path=None,
    font_family="Rubik"
):
    headline = _safe(headline)
    subheadline = _safe(subheadline)
    cta = _safe(cta)
    business_name = _safe(business_name)

    secondary_color = (
        secondary_color
        or _darken_hex(primary_color)
    )

    output_path = os.path.join(
        OUTPUT_DIR,
        output_name
    )

    logo_full_path = _resolve_static_path(
        logo_path
    )

    background_full_path = _resolve_static_path(
        background_image_path
    )

    logo_data = _file_to_data_uri(
        logo_full_path
    )

    background_data = _file_to_data_uri(
        background_full_path
    )

    font_data, resolved_font = _font_data_uri(
        font_family
    )

    font_face = ""

    if font_data:
        font_face = f"""
        @font-face {{
            font-family: 'TripleBrandFont';
            src: url('{font_data}');
            font-weight: 100 900;
            font-style: normal;
        }}
        """

        css_font_family = "'TripleBrandFont', Arial, sans-serif"
    else:
        css_font_family = f"'{resolved_font}', Arial, sans-serif"

    is_rtl = direction == "rtl"

    text_align = (
        "right"
        if is_rtl
        else "left"
    )

    logo_side = (
        "right: 60px;"
        if is_rtl
        else "left: 60px;"
    )

    accent_side = (
        "right: 0;"
        if is_rtl
        else "left: 0;"
    )

    content_side = (
        "right: 85px;"
        if is_rtl
        else "left: 85px;"
    )

    logo_html = ""

    if logo_data:
        logo_html = f"""
        <div class="logo">
            <img
                src="{logo_data}"
                alt="Business logo"
            />
        </div>
        """

    elif business_name:
        logo_html = f"""
        <div class="logo logo-text">
            {business_name}
        </div>
        """

    image_layer = ""

    if background_data:
        image_layer = f"""
        <div
            class="brand-image"
            style="
                background-image:
                url('{background_data}');
            "
        ></div>
        """

    common_css = f"""
        {font_face}

        * {{
            box-sizing: border-box;
        }}

        html,
        body {{
            margin: 0;
            padding: 0;
            width: 1080px;
            height: 1080px;
            overflow: hidden;
        }}

        body {{
            font-family: {css_font_family};
        }}

        .poster {{
            width: 1080px;
            height: 1080px;
            position: relative;
            overflow: hidden;
            direction: {direction};
        }}

        .brand-image {{
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }}

        .logo {{
            position: absolute;
            top: 52px;
            {logo_side}
            z-index: 20;
            max-width: 230px;
            max-height: 120px;
        }}

        .logo img {{
            display: block;
            max-width: 230px;
            max-height: 110px;
            width: auto;
            height: auto;
            object-fit: contain;
        }}

        .logo-text {{
            color: white;
            font-size: 34px;
            font-weight: 800;
        }}

        .headline,
        .subheadline {{
            white-space: pre-line;
        }}

        .cta {{
            display: inline-block;
            white-space: nowrap;
        }}
    """

    if layout == "minimal_center":

        if background_data:
            background_css = f"""
                background: {secondary_color};

                .brand-image {{
                    opacity: 1;
                }}

                .image-overlay {{
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(
                            135deg,
                            rgba(0,0,0,0.68) 0%,
                            rgba(0,0,0,0.28) 55%,
                            rgba(0,0,0,0.58) 100%
                        );
                }}
            """
        else:
            background_css = f"""
                background:
                    radial-gradient(
                        circle at 20% 20%,
                        rgba(255,255,255,0.12),
                        transparent 30%
                    ),
                    linear-gradient(
                        135deg,
                        {secondary_color} 0%,
                        {primary_color} 100%
                    );
            """

        html_content = f"""
        <html dir="{direction}">
        <head>
            <meta charset="UTF-8">

            <style>
                {common_css}

                .poster {{
                    {background_css}
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }}

                .content {{
                    width: 800px;
                    text-align: center;
                    position: relative;
                    z-index: 10;
                    padding: 55px;
                }}

                .headline {{
                    font-size: 94px;
                    line-height: 1.04;
                    font-weight: 800;
                    margin-bottom: 30px;
                    text-shadow:
                        0 5px 24px
                        rgba(0,0,0,0.28);
                }}

                .subheadline {{
                    font-size: 34px;
                    line-height: 1.5;
                    margin-bottom: 44px;
                    opacity: 0.96;
                    text-shadow:
                        0 3px 16px
                        rgba(0,0,0,0.28);
                }}

                .cta {{
                    padding: 18px 35px;
                    border: 2px solid white;
                    border-radius: 999px;
                    font-size: 26px;
                    font-weight: 700;
                    backdrop-filter: blur(5px);
                    background:
                        rgba(0,0,0,0.15);
                }}
            </style>
        </head>

        <body>
            <div class="poster">

                {image_layer}

                {
                    '<div class="image-overlay"></div>'
                    if background_data
                    else ''
                }

                {logo_html}

                <div class="content">

                    <div class="headline">
                        {headline}
                    </div>

                    {
                        "<div class='subheadline'>"
                        + subheadline
                        + "</div>"
                        if subheadline
                        else ""
                    }

                    {
                        "<div class='cta'>"
                        + cta
                        + "</div>"
                        if cta
                        else ""
                    }

                </div>

            </div>
        </body>
        </html>
        """

    elif layout == "split_accent":

        image_panel = ""

        if background_data:
            image_panel = f"""
            <div class="photo-panel">
                <img
                    src="{background_data}"
                    alt=""
                />
            </div>
            """

        html_content = f"""
        <html dir="{direction}">
        <head>
            <meta charset="UTF-8">

            <style>
                {common_css}

                .poster {{
                    background: #f8fafc;
                    color: #111827;
                }}

                .accent {{
                    position: absolute;
                    top: 0;
                    {accent_side}
                    width: 42px;
                    height: 1080px;
                    background:
                        {primary_color};
                    z-index: 5;
                }}

                .photo-panel {{
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    {"left" if is_rtl else "right"}: 0;
                    width: 44%;
                    overflow: hidden;
                }}

                .photo-panel img {{
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }}

                .photo-panel::after {{
                    content: "";
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(
                            180deg,
                            transparent 50%,
                            rgba(0,0,0,0.20)
                        );
                }}

                .logo {{
                    z-index: 20;
                }}

                .logo-text {{
                    color: #111827;
                }}

                .content {{
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    {content_side}
                    width: {
                        "500px"
                        if background_data
                        else "800px"
                    };
                    text-align: {text_align};
                    z-index: 10;
                }}

                .mini-line {{
                    width: 85px;
                    height: 7px;
                    border-radius: 999px;
                    background: {primary_color};
                    margin-bottom: 34px;
                }}

                .headline {{
                    font-size: {
                        "78px"
                        if background_data
                        else "92px"
                    };
                    line-height: 1.04;
                    font-weight: 800;
                    color: #111827;
                    margin-bottom: 30px;
                }}

                .subheadline {{
                    font-size: 31px;
                    line-height: 1.55;
                    color: #475569;
                    margin-bottom: 44px;
                }}

                .cta {{
                    padding: 18px 34px;
                    border-radius: 999px;
                    background: {primary_color};
                    color: white;
                    font-size: 25px;
                    font-weight: 700;
                }}
            </style>
        </head>

        <body>
            <div class="poster">

                <div class="accent"></div>

                {image_panel}

                {logo_html}

                <div class="content">

                    <div class="mini-line"></div>

                    <div class="headline">
                        {headline}
                    </div>

                    {
                        "<div class='subheadline'>"
                        + subheadline
                        + "</div>"
                        if subheadline
                        else ""
                    }

                    {
                        "<div class='cta'>"
                        + cta
                        + "</div>"
                        if cta
                        else ""
                    }

                </div>

            </div>
        </body>
        </html>
        """

    elif layout == "editorial":

        stripe_side = (
            "left: 70px;"
            if is_rtl
            else "right: 70px;"
        )

        if background_data:
            editorial_background = f"""
                background: {secondary_color};

                .brand-image {{
                    opacity: 1;
                }}

                .editorial-overlay {{
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(
                            90deg,
                            rgba(0,0,0,0.74) 0%,
                            rgba(0,0,0,0.48) 55%,
                            rgba(0,0,0,0.18) 100%
                        );
                }}
            """
        else:
            editorial_background = f"""
                background:
                    linear-gradient(
                        135deg,
                        {secondary_color} 0%,
                        {primary_color} 65%,
                        {secondary_color} 100%
                    );
            """

        html_content = f"""
        <html dir="{direction}">
        <head>
            <meta charset="UTF-8">

            <style>
                {common_css}

                .poster {{
                    {editorial_background}
                    color: white;
                }}

                .editorial-stripe {{
                    position: absolute;
                    top: 90px;
                    {stripe_side}
                    width: 7px;
                    height: 900px;
                    border-radius: 999px;
                    background:
                        rgba(255,255,255,0.30);
                    z-index: 10;
                }}

                .content {{
                    position: absolute;
                    top: 210px;
                    {content_side}
                    width: 740px;
                    text-align: {text_align};
                    z-index: 10;
                }}

                .headline {{
                    font-size: 94px;
                    line-height: 1.03;
                    font-weight: 900;
                    margin-bottom: 30px;
                    text-shadow:
                        0 6px 28px
                        rgba(0,0,0,0.28);
                }}

                .subheadline {{
                    font-size: 33px;
                    line-height: 1.55;
                    max-width: 680px;
                    margin-bottom: 50px;
                    color:
                        rgba(255,255,255,0.94);
                }}

                .cta {{
                    padding: 18px 34px;
                    border-radius: 14px;
                    background: white;
                    color: {secondary_color};
                    font-size: 26px;
                    font-weight: 800;
                }}

                .bottom-glow {{
                    position: absolute;
                    bottom: -120px;
                    left: 50%;
                    transform:
                        translateX(-50%);
                    width: 900px;
                    height: 300px;
                    background:
                        radial-gradient(
                            circle,
                            rgba(255,255,255,0.14)
                            0%,
                            transparent 70%
                        );
                }}
            </style>
        </head>

        <body>
            <div class="poster">

                {image_layer}

                {
                    '<div class="editorial-overlay"></div>'
                    if background_data
                    else ''
                }

                <div class="editorial-stripe"></div>

                {logo_html}

                <div class="content">

                    <div class="headline">
                        {headline}
                    </div>

                    {
                        "<div class='subheadline'>"
                        + subheadline
                        + "</div>"
                        if subheadline
                        else ""
                    }

                    {
                        "<div class='cta'>"
                        + cta
                        + "</div>"
                        if cta
                        else ""
                    }

                </div>

                <div class="bottom-glow"></div>

            </div>
        </body>
        </html>
        """

    else:
        raise ValueError(
            "Unsupported layout. Use: "
            "minimal_center, split_accent, editorial"
        )

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True
        )

        page = browser.new_page(
            viewport={
                "width": 1080,
                "height": 1080
            }
        )

        page.set_content(
            html_content,
            wait_until="networkidle"
        )

        page.screenshot(
            path=output_path,
            full_page=False
        )

        browser.close()

    return output_path


def render_brand_poster(
    brand_settings,
    headline,
    subheadline="",
    cta="",
    layout="minimal_center",
    output_name="poster.png",
    gallery_index=0
):
    """
    יוצר פוסטר לפי BrandSettings אמיתי של העסק.

    gallery_index:
    כרגע מאפשר לבחור איזו תמונה מהגלריה תיכנס.
    בהמשך Creative Director / AI יבחר את התמונה
    לפי description והקמפיין.
    """

    primary_color = (
        brand_settings.primary_color
        or "#355c4d"
    )

    palette = _parse_palette(
        brand_settings.palette
    )

    secondary_color = None

    for color in palette:
        if (
            color
            and color.lower()
            != primary_color.lower()
        ):
            secondary_color = color
            break

    if not secondary_color:
        secondary_color = _darken_hex(
            primary_color
        )

    logos = _parse_logos(
        brand_settings.logos
    )

    logo_path = (
        logos[0]
        if logos
        else None
    )

    gallery = _parse_gallery(
        brand_settings.gallery
    )

    background_image_path = None

    if gallery:

        if gallery_index < 0:
            gallery_index = 0

        if gallery_index >= len(gallery):
            gallery_index = 0

        selected_item = gallery[
            gallery_index
        ]

        if isinstance(
            selected_item,
            dict
        ):
            background_image_path = (
                selected_item.get("path")
            )

    if (
        not background_image_path
        and brand_settings.main_image
    ):
        background_image_path = (
            brand_settings.main_image
        )

    language = (
        brand_settings.preferred_language
    )

    direction = _direction_from_language(
        language
    )

    font_family = (
        brand_settings.font_title
        or _default_font_for_language(
            language
        )
    )

    return render_poster(
        headline=headline,
        subheadline=subheadline,
        cta=cta,
        primary_color=primary_color,
        secondary_color=secondary_color,
        direction=direction,
        output_name=output_name,
        layout=layout,
        logo_path=logo_path,
        business_name=(
            brand_settings.business_name
            or ""
        ),
        background_image_path=(
            background_image_path
        ),
        font_family=font_family
    )

def render_blueprint_poster(
    brand_settings,
    blueprint,
    campaign_id
):
    composition = blueprint.get("composition") or {}

    primary_color = (
        brand_settings.primary_color
        or "#355c4d"
    )

    palette = _parse_palette(
        brand_settings.palette
    )

    secondary_color = next(
        (
            color for color in palette
            if color
            and color.lower() != primary_color.lower()
        ),
        _darken_hex(primary_color)
    )

    language = brand_settings.preferred_language
    direction = _direction_from_language(language)

    font_family = (
        brand_settings.font_title
        or _default_font_for_language(language)
    )
    print("POSTER FONT:", font_family)

    font_data, _ = _font_data_uri(font_family)

    font_face = ""

    if font_data:
        font_face = f"""
        @font-face {{
            font-family: 'TripleBrandFont';
            src: url('{font_data}');
        }}
        """

    logos = _parse_logos(
        brand_settings.logos
    )

    logo_path = logos[0] if logos else None
    logo_full = _resolve_static_path(logo_path)
    logo_data = _file_to_data_uri(logo_full)

    image_path = blueprint.get("image_path")
    image_full = _resolve_static_path(image_path)
    image_data = _file_to_data_uri(image_full)

    headline = _safe(
        blueprint.get("headline")
    )

    subheadline = _safe(
        blueprint.get("subheadline")
    )

    cta = _safe(
        blueprint.get("cta")
    )

    creative_type = blueprint.get(
        "creative_type",
        "brand_asset"
    )

    creative_kind = blueprint.get(
        "creative_kind",
        ""
    )

    graphic_direction = (
    blueprint.get("graphic_direction")
    or {}
    )

    visual_style = str(
        graphic_direction.get("visual_style", "")
    ).lower()

    shape_language = str(
        graphic_direction.get("shape_language", "")
    ).lower()

    background_treatment = str(
        graphic_direction.get("background_treatment", "")
    ).lower()

    typography_treatment = str(
        graphic_direction.get("typography_treatment", "")
    ).lower()

    special_element = str(
        graphic_direction.get("special_element", "")
    ).lower()

    graphic_signature = " ".join([
        visual_style,
        shape_language,
        background_treatment,
        typography_treatment,
        special_element,
    ])

    graphic_seed = sum(
        ord(char)
        for char in graphic_signature
    )

    graphic_variant = graphic_seed % 4

    background_variant = (graphic_seed // 4) % 4
    typography_variant = (graphic_seed // 16) % 4

    
    graphic_backgrounds = [
    # Brand Dark
    f"""
    linear-gradient(
        145deg,
        #111827 0%,
        {secondary_color} 52%,
        {primary_color} 100%
    )
    """,

    # Brand Light
    f"""
    radial-gradient(
        circle at 80% 20%,
        {primary_color}22,
        transparent 32%
    ),
    linear-gradient(
        135deg,
        #f8fafc 0%,
        #eef2f7 100%
    )
    """,

    # Bold Brand Gradient
    f"""
    radial-gradient(
        circle at 20% 25%,
        rgba(255,255,255,.18),
        transparent 30%
    ),
    linear-gradient(
        135deg,
        {primary_color} 0%,
        {secondary_color} 55%,
        #111827 100%
    )
    """,

    # Editorial Neutral
    f"""
    linear-gradient(
        160deg,
        #f8fafc 0%,
        #e5e7eb 62%,
        {primary_color} 160%
    )
    """
    ]

    graphic_typography_styles = [
        """
        letter-spacing:-2px;
        font-weight:900;
        """,

        """
        letter-spacing:1px;
        font-weight:700;
        """,

        """
        letter-spacing:-4px;
        font-weight:900;
        line-height:.94;
        """,

        """
        letter-spacing:3px;
        font-weight:800;
        """
    ]

    poster_background = f"""
    radial-gradient(
        circle at 20% 20%,
        {primary_color},
        transparent 45%
    ),
    linear-gradient(
        135deg,
        {secondary_color},
        {primary_color}
    )
    """

    headline_extra_css = ""

    content_color = "white"
    cta_background = "white"
    cta_color = secondary_color

    if creative_kind == "pure_graphic":
        if background_variant in [1, 3]:
            content_color = "#111827"
            cta_background = primary_color
            cta_color = "white"

    if creative_kind == "pure_graphic":
        poster_background = (
        graphic_backgrounds[
            background_variant
        ]
    )

    headline_extra_css = (
        graphic_typography_styles[
            typography_variant
        ]
    )

    text_position = composition.get(
        "text_position",
        "center"
    )

    logo_position = composition.get(
        "logo_position",
        "top_right"
    )

    headline_scale = composition.get(
        "headline_scale",
        "large"
    )

    text_width = composition.get(
        "text_width",
        "medium"
    )

    alignment = composition.get(
        "alignment",
        "right"
    )

    overlay = composition.get(
        "overlay",
        "dark_gradient"
    )

    image_usage = composition.get(
        "image_usage",
        "full_bleed"
    )

    headline_sizes = {
        "medium": "66px",
        "large": "82px",
        "hero": "98px",
        "oversized": "118px",
    }

    widths = {
        "narrow": "520px",
        "medium": "700px",
        "wide": "860px",
    }

    position_css = {
        "top_right":
            "top:130px; right:80px;",
        "top_left":
            "top:130px; left:80px;",
        "center":
            "top:50%; left:50%; transform:translate(-50%,-50%);",
        "center_right":
            "top:50%; right:80px; transform:translateY(-50%);",
        "center_left":
            "top:50%; left:80px; transform:translateY(-50%);",
        "bottom_right":
            "bottom:100px; right:80px;",
        "bottom_left":
            "bottom:100px; left:80px;",
        "bottom_center":
            "bottom:100px; left:50%; transform:translateX(-50%);",
    }

    logo_css = {
        "top_right":
            "top:55px; right:60px;",
        "top_left":
            "top:55px; left:60px;",
        "bottom_right":
            "bottom:55px; right:60px;",
        "bottom_left":
            "bottom:55px; left:60px;",
    }

    overlay_css = {
        "none":
            "transparent",

        "dark_gradient":
            "linear-gradient(135deg, rgba(0,0,0,.68), rgba(0,0,0,.18))",

        "light_gradient":
            "linear-gradient(135deg, rgba(255,255,255,.75), rgba(255,255,255,.12))",

        "bottom_gradient":
            "linear-gradient(to top, rgba(0,0,0,.78), transparent 70%)",

        "side_gradient":
            "linear-gradient(to left, rgba(0,0,0,.72), transparent 75%)",

        "soft_color_wash":
            f"linear-gradient(135deg, {primary_color}88, {secondary_color}44)",

        "glass_panel":
            "linear-gradient(135deg, rgba(0,0,0,.38), rgba(0,0,0,.10))",
    }

    image_css = ""

    if image_data:
        if image_usage == "split_vertical":
            image_css = f"""
            .photo {{
                position:absolute;
                top:0;
                left:0;
                width:46%;
                height:100%;
                object-fit:cover;
            }}
            """

        elif image_usage == "split_horizontal":
            image_css = f"""
            .photo {{
                position:absolute;
                top:0;
                left:0;
                width:100%;
                height:52%;
                object-fit:cover;
            }}
            """

        elif image_usage == "framed":
            image_css = """
            .photo {
                position:absolute;
                inset:70px;
                width:calc(100% - 140px);
                height:calc(100% - 140px);
                object-fit:cover;
                border-radius:36px;
            }
            """

        else:
            image_css = """
            .photo {
                position:absolute;
                inset:0;
                width:100%;
                height:100%;
                object-fit:cover;
            }
            """

    logo_html = ""

    if logo_data:
        logo_html = f"""
        <img
            class="logo"
            src="{logo_data}"
        />
        """

    elif brand_settings.business_name:
        logo_html = f"""
        <div class="logo-text">
            {_safe(brand_settings.business_name)}
        </div>
        """

    photo_html = ""

    if image_data:
        photo_html = f"""
        <img
            class="photo"
            src="{image_data}"
        />
        """

    graphic_html = ""

    if creative_kind == "pure_graphic":

        if graphic_variant == 0:
            graphic_html = """
            <div class="graphic-orbit"></div>
            <div class="graphic-frame"></div>
            <div class="graphic-line"></div>
            <div class="graphic-dot"></div>
            """

        elif graphic_variant == 1:
            graphic_html = """
            <div class="graphic-circle-large"></div>
            <div class="graphic-circle-small"></div>
            <div class="graphic-diagonal"></div>
            """

        elif graphic_variant == 2:
            graphic_html = """
            <div class="graphic-grid"></div>
            <div class="graphic-block"></div>
            <div class="graphic-accent-line"></div>
            """

        else:
            graphic_html = """
            <div class="graphic-blob-one"></div>
            <div class="graphic-blob-two"></div>
            <div class="graphic-ring"></div>
            """

    elif creative_kind == "generated_visual":
        graphic_html = """
        <div class="visual-glow visual-glow-one"></div>
        <div class="visual-glow visual-glow-two"></div>
        <div class="visual-horizon"></div>
        <div class="visual-light"></div>
        """

    output_name = (
        f"campaign_{campaign_id}_"
        f"{blueprint.get('id', 'design')}.png"
    )

    output_path = os.path.join(
        OUTPUT_DIR,
        output_name
    )

    html_content = f"""
    <html dir="{direction}">
    <head>
        <meta charset="UTF-8">

        <style>
            {font_face}

            * {{
                box-sizing:border-box;
            }}

            html,
            body {{
                margin:0;
                width:1080px;
                height:1080px;
                overflow:hidden;
            }}

            body {{
                font-family:
                    'TripleBrandFont',
                    Arial,
                    sans-serif;
            }}

            .poster {{
                width:1080px;
                height:1080px;
                position:relative;
                overflow:hidden;

                background:
                    {poster_background};
                    ),
                    linear-gradient(
                        135deg,
                        {secondary_color},
                        {primary_color}
                    );
            }}

            {image_css}

            .overlay {{
                position:absolute;
                inset:0;
                background:
                    {overlay_css.get(
                        overlay,
                        overlay_css["dark_gradient"]
                    )};
                z-index:2;
            }}

            .content {{
                position:absolute;
                {position_css.get(
                    text_position,
                    position_css["center"]
                )}

                width:
                    {widths.get(
                        text_width,
                        "700px"
                    )};

                text-align:{alignment};
                z-index:10;
                color:{content_color};
            }}

            .headline {{
                font-size:
                    {headline_sizes.get(
                        headline_scale,
                        "82px"
                    )};

                line-height:1.02;
                font-weight:900;
                {headline_extra_css}
                margin-bottom:28px;
                text-shadow:
                    0 6px 25px
                    rgba(0,0,0,.28);
            }}

            .subheadline {{
                font-size:32px;
                line-height:1.45;
                margin-bottom:38px;
                opacity:.94;
            }}

            .cta {{
                display:inline-block;
                padding:17px 32px;
                border-radius:999px;
                background:{cta_background};
                color:{cta_color};
                font-size:25px;
                font-weight:800;
            }}

            .logo {{
                position:absolute;
                {logo_css.get(
                    logo_position,
                    logo_css["top_right"]
                )}

                max-width:220px;
                max-height:105px;
                object-fit:contain;
                z-index:20;
            }}

            .logo-text {{
                position:absolute;
                {logo_css.get(
                    logo_position,
                    logo_css["top_right"]
                )}

                color:white;
                font-size:34px;
                font-weight:900;
                z-index:20;
            }}

                        /* PURE GRAPHIC */
            .graphic-orbit {{
                position:absolute;
                width:620px;
                height:620px;
                border:70px solid rgba(255,255,255,.10);
                border-radius:50%;
                top:-240px;
                left:-180px;
                z-index:1;
            }}

            .graphic-frame {{
                position:absolute;
                width:360px;
                height:520px;
                border:4px solid rgba(255,255,255,.20);
                right:90px;
                bottom:-110px;
                transform:rotate(14deg);
                z-index:1;
            }}

            .graphic-line {{
                position:absolute;
                width:520px;
                height:8px;
                background:rgba(255,255,255,.28);
                left:80px;
                bottom:150px;
                z-index:1;
            }}

            .graphic-dot {{
                        /* PURE GRAPHIC - VARIANT 1 */
            .graphic-circle-large {{
                position:absolute;
                width:520px;
                height:520px;
                border-radius:50%;
                border:55px solid rgba(255,255,255,.12);
                right:-120px;
                top:-100px;
                z-index:1;
            }}

            .graphic-circle-small {{
                position:absolute;
                width:120px;
                height:120px;
                border-radius:50%;
                background:rgba(255,255,255,.18);
                left:120px;
                bottom:150px;
                z-index:1;
            }}

            .graphic-diagonal {{
                position:absolute;
                width:720px;
                height:7px;
                background:rgba(255,255,255,.25);
                left:-80px;
                bottom:270px;
                transform:rotate(-18deg);
                z-index:1;
            }}

            /* PURE GRAPHIC - VARIANT 2 */
            .graphic-grid {{
                position:absolute;
                inset:70px;
                background-image:
                    linear-gradient(
                        rgba(255,255,255,.08) 1px,
                        transparent 1px
                    ),
                    linear-gradient(
                        90deg,
                        rgba(255,255,255,.08) 1px,
                        transparent 1px
                    );
                background-size:70px 70px;
                z-index:1;
            }}

            .graphic-block {{
                position:absolute;
                width:300px;
                height:300px;
                background:rgba(255,255,255,.10);
                right:90px;
                bottom:80px;
                transform:rotate(8deg);
                z-index:1;
            }}

            .graphic-accent-line {{
                position:absolute;
                width:9px;
                height:520px;
                background:rgba(255,255,255,.30);
                left:120px;
                top:140px;
                z-index:1;
            }}

            /* PURE GRAPHIC - VARIANT 3 */
            .graphic-blob-one {{
                position:absolute;
                width:620px;
                height:430px;
                border-radius:55% 45% 60% 40%;
                background:rgba(255,255,255,.10);
                top:-130px;
                right:-160px;
                transform:rotate(18deg);
                z-index:1;
            }}

            .graphic-blob-two {{
                position:absolute;
                width:420px;
                height:420px;
                border-radius:48% 52% 38% 62%;
                background:rgba(255,255,255,.08);
                left:-120px;
                bottom:-100px;
                transform:rotate(-12deg);
                z-index:1;
            }}

            .graphic-ring {{
                position:absolute;
                width:260px;
                height:260px;
                border-radius:50%;
                border:28px solid rgba(255,255,255,.16);
                right:120px;
                bottom:120px;
                z-index:1;
            }}
            }}

            /* GENERATED VISUAL PLACEHOLDER */
            .visual-glow {{
                position:absolute;
                border-radius:50%;
                filter:blur(70px);
                z-index:1;
            }}

            .visual-glow-one {{
                width:700px;
                height:700px;
                background:{primary_color};
                top:-180px;
                right:-180px;
                opacity:.55;
            }}

            .visual-glow-two {{
                width:600px;
                height:600px;
                background:{secondary_color};
                bottom:-220px;
                left:-160px;
                opacity:.75;
            }}

            .visual-horizon {{
                position:absolute;
                width:120%;
                height:330px;
                left:-10%;
                bottom:-100px;
                border-radius:50% 50% 0 0;
                background:rgba(255,255,255,.08);
                transform:rotate(-5deg);
                z-index:1;
            }}

            .visual-light {{
                position:absolute;
                width:500px;
                height:500px;
                border-radius:50%;
                background:
                    radial-gradient(
                        circle,
                        rgba(255,255,255,.25),
                        transparent 65%
                    );
                left:50%;
                top:50%;
                transform:translate(-50%,-50%);
                z-index:1;
            }}

        </style>
    </head>

    <body>

        <div class="poster">

            {photo_html}

            {graphic_html}

            <div class="overlay"></div>

            {logo_html}

            <div class="content">

                <div class="headline">
                    {headline}
                </div>

                {
                    f'<div class="subheadline">{subheadline}</div>'
                    if subheadline else ''
                }

                {
                    f'<div class="cta">{cta}</div>'
                    if cta else ''
                }

            </div>

        </div>

    </body>
    </html>
    """

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True
        )

        page = browser.new_page(
            viewport={
                "width":1080,
                "height":1080
            }
        )

        page.set_content(
            html_content,
            wait_until="networkidle"
        )

        page.screenshot(
            path=output_path,
            full_page=False
        )

        browser.close()

    return {
        "file_path": output_path,
        "image_url":
            f"/static/uploads/poster_html/{output_name}"
    }