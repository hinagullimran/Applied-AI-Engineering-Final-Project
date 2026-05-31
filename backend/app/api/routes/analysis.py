from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()

class ReviewData(BaseModel):
    review_text: str

@router.post("/analyze-gap")
async def analyze_gap(data: ReviewData):
    """
    Analyze a review text and identify market gaps using Google Gemini (free)
    or OpenAI as fallback.
    """
    prompt = f"""
    You are a Global E-commerce Strategist. Your goal is to analyze social sentiment and find "Product Gaps" for a global audience.

    Input: Scraped comments from TikTok, Reddit, and Instagram.
    "{data.review_text}"

    Output Requirements:
    1. Sentiment Heatmap: Identify if the global sentiment is shifting from "Hype" to "Frustration."
    2. The "Critical Defect": Pinpoint exactly why people are returning or complaining about the product (e.g., "The motor overheats after 10 mins").
    3. The "Global Version" Solution: Propose a modification (e.g., "Add a copper heat sink and universal voltage plug").
    4. Supply Chain Match: Generate search terms for sourcing on global marketplaces.

    Return the output as a valid JSON object with EXACTLY the following keys:
    - "sentiment_heatmap" (string)
    - "critical_defect" (string)
    - "global_version_solution" (string)
    - "supply_chain_match_terms" (array of strings)
    
    Do not use markdown formatting like ```json.
    """

    import json

    # Try Google Gemini first (free)
    if settings.GOOGLE_API_KEY:
        try:
            import google.genai as genai
            client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )
            result_text = response.text.strip()
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            return json.loads(result_text)
        except Exception as e:
            print(f"Gemini failed, trying OpenAI: {e}")

    # Fallback to OpenAI if configured
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "YOUR_OPENAI_API_KEY_HERE":
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        result_text = response.choices[0].message.content.strip()
        try:
            return json.loads(result_text)
        except json.JSONDecodeError:
            return {"raw_analysis": result_text}

    # Mock fallback if no AI keys are configured
    return {
        "sentiment_heatmap": "Mixed — shifting from Hype to Frustration based on review patterns.",
        "critical_defect": "Product quality declines after 30 days of use based on complaints.",
        "global_version_solution": "Source an upgraded version with premium materials and extended warranty.",
        "supply_chain_match_terms": ["premium quality supplier", "OEM manufacturer", "bulk wholesale"]
    }


class DiscoveryRequest(BaseModel):
    category: str
    client_id: str = None

@router.post("/market-discovery")
async def trigger_discovery(request: DiscoveryRequest):
    """
    Run market discovery directly (no Celery/Redis required).
    """
    from app.agents.manager import manager
    result = await manager.discover_opportunity(request.category, request.client_id)
    return {"status": "complete", "result": result}
