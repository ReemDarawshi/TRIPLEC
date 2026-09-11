import json
import uuid


def _parse_json_list(value):
    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    return []


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


def _clean_gallery(brand):
    gallery = _parse_gallery(brand.gallery)

    cleaned = []

    for index, item in enumerate(gallery):
        if not isinstance(item, dict):
            continue

        path = item.get("path")

        if not path:
            continue

        # לא להכניס פוסטרים שכבר נוצרו בחזרה לגלריה
        if str(path).startswith("/static/uploads/poster/"):
            continue

        cleaned.append({
            "index": index,
            "path": path,
            "description": item.get("description") or "ללא תיאור"
        })

    return cleaned


def _validate_blueprints(blueprints, gallery):
    if not isinstance(blueprints, list):
        raise ValueError("Creative Director did not return a list")

    if len(blueprints) != 5:
        raise ValueError(
            "Creative Director must return exactly 5 blueprints"
        )

    brand_assets = [
        item
        for item in blueprints
        if item.get("creative_type") == "brand_asset"
    ]

    ai_creatives = [
        item
        for item in blueprints
        if item.get("creative_type") == "ai_creative"
    ]

    if len(brand_assets) != 3:
        raise ValueError(
            "Creative Director must return exactly 3 brand asset designs"
        )

    if len(ai_creatives) != 2:
        raise ValueError(
            "Creative Director must return exactly 2 AI creative designs"
        )

    valid_indexes = {
        item["index"]
        for item in gallery
    }

    chosen_indexes = []

    for blueprint in brand_assets:
        gallery_index = blueprint.get("gallery_index")

        if gallery_index not in valid_indexes:
            raise ValueError(
                f"Invalid gallery index: {gallery_index}"
            )

        chosen_indexes.append(gallery_index)

    if len(set(chosen_indexes)) != 3:
        raise ValueError(
            "The 3 brand asset designs must use 3 different gallery images"
        )

    creative_kinds = {
        item.get("creative_kind")
        for item in ai_creatives
    }

    if "pure_graphic" not in creative_kinds:
        raise ValueError(
            "One AI creative must be pure_graphic"
        )

    if "generated_visual" not in creative_kinds:
        raise ValueError(
            "One AI creative must be generated_visual"
        )

    return blueprints


def generate_creative_blueprints(
    client,
    brand,
    campaign,
    selected_text=""
):
    """
    Creative Director של TRIPLE.

    מחזיר בדיוק:
    - 3 Brand Asset designs
    - 2 AI Creative designs

    בשלב הזה הפונקציה מחזירה החלטות עיצוב בלבד.
    ה-renderer ייצור את הפוסטרים בפועל בשלב הבא.
    """

    gallery = _clean_gallery(brand)

    if len(gallery) < 3:
        raise ValueError(
            "At least 3 gallery images are required "
            "to create 3 Brand Asset designs"
        )

    campaign_prompt = (
        campaign.ai_prompt
        or ""
    )

    target_roles = _parse_json_list(
        campaign.target_roles
    )

    target_groups = _parse_json_list(
        campaign.target_groups
    )

    gallery_for_ai = [
        {
            "index": item["index"],
            "description": item["description"]
        }
        for item in gallery
    ]

    context = {
        "business": {
            "name": brand.business_name or "",
            "description": brand.description or "",
            "category": brand.business_category or "",
            "target_audience": brand.target_audience or "",
            "tone_of_voice": brand.tone_of_voice or "",
            "unique_value_proposition":
                brand.unique_value_proposition or "",
            "main_products_services":
                brand.main_products_services or "",
            "marketing_goals":
                brand.marketing_goals or "",
            "preferred_language":
                brand.preferred_language or "עברית",
            "preferred_cta":
                brand.preferred_cta or "",
            "preferred_phrases":
                brand.preferred_phrases or "",
            "avoid_phrases":
                brand.avoid_phrases or "",
            "primary_color":
                brand.primary_color or "",
            "palette":
                brand.palette or "",
            "font_title":
                brand.font_title or ""
        },
        

        "campaign": {
            "name": campaign.name or "",
            "objective": campaign.type or "",
            "brief": campaign_prompt,
            "selected_text": selected_text or "",
            "target_roles": target_roles,
            "target_groups": target_groups
        },

        "gallery": gallery_for_ai
    }
    diversity_seed = uuid.uuid4().hex[:8]

    prompt = f"""
You are the Creative Director inside TRIPLE,
a SaaS system that creates marketing campaigns for businesses.

Your task is NOT to create finished HTML or CSS.

Your task is to think like a senior advertising art director
and create exactly 5 highly differentiated Creative Blueprints.

The designs must feel intentional, premium and campaign-specific.
They must NOT look like five variations of one template.


==================================================
CREATIVE SESSION
==================================================

Creative session id:
{diversity_seed}

Treat this as a completely new creative session.

Before creating any design, first infer the most appropriate visual
strategy from:
- the business category and personality
- the campaign objective
- the campaign brief
- the selected marketing text
- the target audience
- the available brand images and their descriptions
- the brand colors, typography and tone

Do NOT start from a predefined template.

SURPRISE WITH RELEVANCE:
The designs should feel fresh and unexpected, but never random.
Creative choices must make sense for this specific business and campaign.

CLEAN DESIGN RULE:
Prefer strong visual hierarchy, confident typography, whitespace,
intentional cropping and one clear focal point.

Avoid:
- clutter
- excessive decoration
- too many shapes
- too much text
- generic social-media-template aesthetics
- repeating the same layout because the campaign topic is similar
- always placing the logo, headline or CTA in the same location

DIVERSITY RULE:
All 5 designs must have clearly different visual structures.

Vary meaningfully between them:
- image scale and crop
- amount of negative space
- text placement
- typography scale
- image vs. typography dominance
- color balance
- alignment
- framing
- overlay treatment
- visual rhythm
- CTA treatment
- logo placement

For the 3 Brand Asset designs:
Do not merely place text on three different photos.
Each photo must inspire a different composition.

For the 2 AI Creative designs:
They must not look like variations of each other.
One should rely primarily on graphic art direction and typography.
The other should explore a distinct visual world appropriate to the campaign.

Do not optimize for novelty alone.
The final result must still look believable for the business,
commercially usable and consistent with its brand.

Never choose a composition merely because it appeared in the JSON example below.
The JSON example defines structure only, NOT recommended design choices.

==================================================
BUSINESS + CAMPAIGN CONTEXT
==================================================

{json.dumps(context, ensure_ascii=False, indent=2)}

==================================================
OUTPUT REQUIREMENTS
==================================================

Create exactly 5 designs:

DESIGNS 1-3:
creative_type = "brand_asset"

These 3 designs MUST:
- use 3 DIFFERENT gallery images.
- select the images intelligently according to:
  - campaign brief
  - selected campaign text
  - campaign objective
  - target audience
  - image descriptions
  - emotional fit
  - visual suitability
- never select an image randomly.
- use only images that appear in the provided gallery.
- respect the business brand colors and typography.
- use the real business logo later in rendering.

DESIGN 4:
creative_type = "ai_creative"
creative_kind = "pure_graphic"

This design:
- does NOT use a gallery photo.
- is a highly creative graphic composition.
- can use gradients, typography, shapes, lines,
  depth, texture, framing, geometric composition,
  whitespace and brand colors.
- should feel like a professionally art-directed campaign,
  not a generic social media template.

DESIGN 5:
creative_type = "ai_creative"
creative_kind = "generated_visual"

This design:
- does NOT use a gallery photo.
- defines an original visual concept that could later
  be generated by an image-generation model.
- the generated visual must NOT pretend to show
  a real product, employee, location or business asset
  unless that factual information was provided.
- it should describe atmosphere / visual concept,
  not invent business facts.

==================================================
COPY RULES
==================================================

Poster copy must be minimal.

headline:
- approximately 2-6 words when possible.
- one strong idea.
- campaign specific.
- NOT generic marketing filler.

subheadline:
- optional.
- maximum one short sentence.

cta:
- approximately 2-4 words.
- use preferred CTA when appropriate.
- never invent discounts, prices or offers.

Do not overload the poster with text.

==================================================
DESIGN THINKING
==================================================

For EVERY design:
- choose a distinct art direction.
- choose composition based on the image/content,
  not from one fixed template.
- consider where visual empty space is likely to exist.
- create visual hierarchy.
- ensure strong contrast.
- avoid placing text over visually busy areas when possible.
- keep logo visible but not dominant.
- RTL-aware if the preferred language is Hebrew or Arabic.

The five outputs should differ meaningfully in:
- composition
- visual hierarchy
- image treatment
- text placement
- scale
- graphic language
- emotional feel

Do NOT generate CSS.
Do NOT output HTML.

==================================================
ALLOWED COMPOSITION VALUES
==================================================

text_position:
- top_right
- top_left
- center
- center_right
- center_left
- bottom_right
- bottom_left
- bottom_center

logo_position:
- top_right
- top_left
- bottom_right
- bottom_left

image_usage for brand_asset:
- full_bleed
- split_vertical
- split_horizontal
- framed
- cropped_focus
- background_soft

overlay:
- none
- dark_gradient
- light_gradient
- bottom_gradient
- side_gradient
- soft_color_wash
- glass_panel

headline_scale:
- medium
- large
- hero
- oversized

text_width:
- narrow
- medium
- wide

alignment:
- right
- left
- center

==================================================
JSON OUTPUT SCHEMA
==================================================

Return JSON only.

The JSON must contain exactly one top-level key:
"blueprints"

"blueprints" must contain exactly 5 objects.

Each blueprint must contain:
- id
- creative_type
- creative_kind
- gallery_index
- concept
- art_direction
- headline
- subheadline
- cta
- composition

For brand_asset designs:
- creative_type = "brand_asset"
- creative_kind = "brand_photo"
- gallery_index must reference one of the provided gallery images
- include composition.image_usage
- include composition.overlay

For ai_creative / pure_graphic:
- creative_type = "ai_creative"
- creative_kind = "pure_graphic"
- gallery_index = null
- include graphic_direction with:
  - visual_style
  - shape_language
  - background_treatment
  - typography_treatment
  - special_element

For ai_creative / generated_visual:
- creative_type = "ai_creative"
- creative_kind = "generated_visual"
- gallery_index = null
- include visual_generation with:
  - subject
  - scene
  - mood
  - lighting
  - composition_notes
  - negative_constraints

composition must contain:
- text_position
- logo_position
- headline_scale
- text_width
- alignment

For brand_asset designs, composition must also contain:
- image_usage
- overlay

Use only allowed values from the ALLOWED COMPOSITION VALUES section.

Do not use fixed default combinations.

Choose every design decision from the actual campaign, brand and selected image.

The 3 brand_asset designs must:
- use 3 different gallery images
- use 3 meaningfully different composition strategies
- not simply place different photos into the same structure

The 2 ai_creative designs must:
- be visually distinct from each other
- be visually distinct from the 3 brand_asset designs
- explore different graphic languages

Return valid JSON only.
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior advertising Creative Director. "
                    "You create bold, clean, premium and strategically "
                    "different campaign concepts. "
                    "You never invent business facts."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.9,
        max_tokens=2600,
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

    blueprints = result.get(
        "blueprints",
        []
    )

    blueprints = _validate_blueprints(
        blueprints,
        gallery
    )

    # מחזירים גם את path האמיתי שנבחר
    # כדי שה-renderer לא יצטרך לנחש שוב.
    gallery_by_index = {
        item["index"]: item
        for item in gallery
    }

    for blueprint in blueprints:
        if (
            blueprint.get("creative_type")
            == "brand_asset"
        ):
            selected = gallery_by_index[
                blueprint["gallery_index"]
            ]

            blueprint["image_path"] = (
                selected["path"]
            )

            blueprint[
                "image_description"
            ] = selected[
                "description"
            ]

    return {
        "blueprints": blueprints
    }