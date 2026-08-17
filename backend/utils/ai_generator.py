import openai

def generate_campaign_text(prompt, brand, campaign):
    full_prompt = f"""
    Write 3 short marketing messages based on the following campaign prompt:

    Prompt: {prompt}

    Business Details:
    - Name: {brand.name}
    - Description: {brand.description}
    - Location: {brand.location or 'Not provided'}
    - Business Type: {brand.business_type or 'general'}
    - Main services or products: {brand.keywords or 'Not provided'}

    Use friendly, appealing marketing language, and make sure the text is relevant to the audience.
    """
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a marketing expert that writes short and effective campaign texts."},
            {"role": "user", "content": full_prompt}
        ],
        temperature=0.7
    )

    ai_text = response['choices'][0]['message']['content']

    # נחזיר מערך של טקסטים (לפי ההפרדה של ג’יפיטי)
    return [t.strip() for t in ai_text.split("\n") if t.strip()]
