"""Business display name for the currently saved preferred language."""


def get_brand_display_name(brand):
    original = (brand.business_name or "").strip()
    language = (brand.preferred_language or "עברית").strip()
    localized = (brand.business_name_localized or "").strip()
    if language in ("ערבית", "אנגלית") and localized:
        return localized
    return original
