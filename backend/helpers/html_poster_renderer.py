import os
import html
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..')
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    'static',
    'uploads',
    'poster_html'
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


def _safe(value):
    return html.escape(str(value or ""))


def render_poster(
    headline,
    subheadline="",
    cta="",
    logo_text="TRIPLE",
    primary_color="#355c4d",
    secondary_color="#14251f",
    direction="rtl",
    output_name="poster.png",
    layout="minimal_center"
):
    headline = _safe(headline)
    subheadline = _safe(subheadline)
    cta = _safe(cta)
    logo_text = _safe(logo_text)

    output_path = os.path.join(OUTPUT_DIR, output_name)

    is_rtl = direction == "rtl"
    text_align = "right" if is_rtl else "left"
    logo_side = "right: 60px;" if is_rtl else "left: 60px;"
    accent_side = "right: 0;" if is_rtl else "left: 0;"
    panel_align = "margin-left: auto;" if is_rtl else "margin-right: auto;"

    common_css = f"""
        * {{
            box-sizing: border-box;
        }}

        html, body {{
            margin: 0;
            padding: 0;
            width: 1080px;
            height: 1080px;
            overflow: hidden;
            background: #ffffff;
        }}

        body {{
            font-family: Arial, sans-serif;
        }}

        .poster {{
            width: 1080px;
            height: 1080px;
            position: relative;
            overflow: hidden;
            color: white;
            direction: {direction};
        }}

        .logo {{
            position: absolute;
            top: 54px;
            {logo_side}
            z-index: 5;
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: white;
        }}

        .headline {{
            white-space: pre-line;
        }}

        .subheadline {{
            white-space: pre-line;
        }}

        .cta {{
            display: inline-block;
            white-space: nowrap;
        }}
    """

    if layout == "minimal_center":
        html_content = f"""
        <html dir="{direction}">
        <head>
            <meta charset="UTF-8">
            <style>
                {common_css}

                .poster {{
                    background:
                        radial-gradient(circle at 20% 20%, rgba(255,255,255,0.10), transparent 28%),
                        linear-gradient(135deg, {secondary_color} 0%, {primary_color} 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}

                .content {{
                    width: 760px;
                    text-align: center;
                    z-index: 2;
                }}

                .eyebrow {{
                    font-size: 28px;
                    opacity: 0.75;
                    margin-bottom: 24px;
                    letter-spacing: 0.5px;
                }}

                .headline {{
                    font-size: 92px;
                    line-height: 1.05;
                    font-weight: 800;
                    margin-bottom: 28px;
                }}

                .subheadline {{
                    font-size: 34px;
                    line-height: 1.5;
                    opacity: 0.92;
                    margin-bottom: 44px;
                }}

                .cta {{
                    padding: 18px 34px;
                    border: 2px solid rgba(255,255,255,0.9);
                    border-radius: 999px;
                    font-size: 26px;
                    font-weight: 700;
                }}
            </style>
        </head>
        <body>
            <div class="poster">
                <div class="logo">{logo_text}</div>

                <div class="content">
                    <div class="eyebrow">קמפיין חדש</div>
                    <div class="headline">{headline}</div>
                    {"<div class='subheadline'>" + subheadline + "</div>" if subheadline else ""}
                    {"<div class='cta'>" + cta + "</div>" if cta else ""}
                </div>
            </div>
        </body>
        </html>
        """

    elif layout == "split_accent":
        html_content = f"""
        <html dir="{direction}">
        <head>
            <meta charset="UTF-8">
            <style>
                {common_css}

                .poster {{
                    background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
                    color: #0f172a;
                }}

                .accent {{
                    position: absolute;
                    top: 0;
                    {accent_side}
                    width: 220px;
                    height: 1080px;
                    background: linear-gradient(180deg, {primary_color} 0%, {secondary_color} 100%);
                    opacity: 0.96;
                }}

                .accent-circle {{
                    position: absolute;
                    width: 420px;
                    height: 420px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.08);
                    top: -120px;
                    {accent_side}
                    transform: translateX(35%);
                }}

                .logo {{
                    color: #0f172a;
                }}

                .content-wrap {{
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 120px;
                }}

                .content {{
                    width: 760px;
                    text-align: {text_align};
                    position: relative;
                    z-index: 2;
                }}

                .mini-line {{
                    width: 90px;
                    height: 6px;
                    background: {primary_color};
                    border-radius: 999px;
                    margin-bottom: 34px;
                    {panel_align}
                }}

                .headline {{
                    font-size: 90px;
                    line-height: 1.05;
                    font-weight: 800;
                    margin-bottom: 30px;
                    color: #0f172a;
                }}

                .subheadline {{
                    font-size: 34px;
                    line-height: 1.55;
                    color: #334155;
                    margin-bottom: 44px;
                    max-width: 720px;
                    {panel_align}
                }}

                .cta {{
                    background: {primary_color};
                    color: white;
                    padding: 18px 34px;
                    border-radius: 999px;
                    font-size: 26px;
                    font-weight: 700;
                    box-shadow: 0 12px 30px rgba(0,0,0,0.12);
                }}
            </style>
        </head>
        <body>
            <div class="poster">
                <div class="accent"></div>
                <div class="accent-circle"></div>
                <div class="logo">{logo_text}</div>

                <div class="content-wrap">
                    <div class="content">
                        <div class="mini-line"></div>
                        <div class="headline">{headline}</div>
                        {"<div class='subheadline'>" + subheadline + "</div>" if subheadline else ""}
                        {"<div class='cta'>" + cta + "</div>" if cta else ""}
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

    elif layout == "editorial":
        stripe_side = "left: 70px;" if is_rtl else "right: 70px;"
        block_side = "right: 85px;" if is_rtl else "left: 85px;"

        html_content = f"""
        <html dir="{direction}">
        <head>
            <meta charset="UTF-8">
            <style>
                {common_css}

                .poster {{
                    background:
                        linear-gradient(135deg, {secondary_color} 0%, {primary_color} 55%, #0b1220 100%);
                }}

                .editorial-stripe {{
                    position: absolute;
                    top: 90px;
                    {stripe_side}
                    width: 8px;
                    height: 900px;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.22);
                }}

                .logo {{
                    color: white;
                }}

                .content {{
                    position: absolute;
                    top: 150px;
                    {block_side}
                    width: 760px;
                    text-align: {text_align};
                    z-index: 3;
                }}

                .tag {{
                    display: inline-block;
                    font-size: 24px;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.75);
                    margin-bottom: 28px;
                }}

                .headline {{
                    font-size: 96px;
                    line-height: 1.02;
                    font-weight: 900;
                    margin-bottom: 28px;
                    color: white;
                }}

                .subheadline {{
                    font-size: 33px;
                    line-height: 1.55;
                    color: rgba(255,255,255,0.9);
                    margin-bottom: 54px;
                    max-width: 680px;
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
                    bottom: -80px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 900px;
                    height: 240px;
                    background: radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%);
                }}
            </style>
        </head>
        <body>
            <div class="poster">
                <div class="editorial-stripe"></div>
                <div class="logo">{logo_text}</div>

                <div class="content">
                    <div class="tag">CAMPAIGN</div>
                    <div class="headline">{headline}</div>
                    {"<div class='subheadline'>" + subheadline + "</div>" if subheadline else ""}
                    {"<div class='cta'>" + cta + "</div>" if cta else ""}
                </div>

                <div class="bottom-glow"></div>
            </div>
        </body>
        </html>
        """

    else:
        raise ValueError(
            "Unsupported layout. Use one of: "
            "minimal_center, split_accent, editorial"
        )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        page = browser.new_page(
            viewport={
                "width": 1080,
                "height": 1080
            }
        )

        page.set_content(html_content)
        page.screenshot(
            path=output_path,
            full_page=False
        )

        browser.close()

    return output_path


if __name__ == "__main__":
    layouts = [
        "minimal_center",
        "split_accent",
        "editorial"
    ]

    for layout_name in layouts:
        path = render_poster(
            headline="ארוחה ששווה לעצור\nבשבילה",
            subheadline="טעמים טובים. רגעים טובים יותר.",
            cta="הזמינו מקום",
            logo_text="LOCANDA",
            primary_color="#355c4d",
            secondary_color="#14251f",
            direction="rtl",
            output_name=f"{layout_name}.png",
            layout=layout_name
        )

        print(f"{layout_name} created:", path)