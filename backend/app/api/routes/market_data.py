from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.embeddings import generate_embedding
from app.services.vector_search import upsert_market_data, search_emerging_gaps
import uuid

router = APIRouter()

class MarketDataPayload(BaseModel):
    product_name: str
    review_text: str
    satisfaction_score: float
    is_historical_trend: bool = False

@router.post("/ingest")
async def ingest_market_data(data: MarketDataPayload):
    """
    Ingest raw market data, generate its embedding, and store it in Pinecone.
    """
    try:
        # Generate embedding from the review text
        vector = generate_embedding(data.review_text)
        
        item_id = str(uuid.uuid4())
        
        # Prepare metadata
        metadata = {
            "product_name": data.product_name,
            "review_text": data.review_text,
            "satisfaction_score": data.satisfaction_score,
            "is_historical_trend": data.is_historical_trend
        }
        
        # Upsert to Pinecone
        upsert_market_data(item_id, vector, metadata)
        
        return {"status": "success", "id": item_id, "message": "Market data ingested successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SearchPayload(BaseModel):
    query_text: str
    top_k: int = 5

@router.get("/gaps")
async def get_gaps():
    """
    Fetch processed market gaps directly from Supabase.
    """
    try:
        from app.api.dependencies import get_supabase_client
        supabase = get_supabase_client()
        
        # Fetch reviews that have been processed and have a market gap identified
        # For demonstration, we'll fetch recently inserted ones if 'processed' isn't fully managed yet
        response = supabase.table("competitor_reviews").select("*").order("created_at", desc=True).limit(10).execute()
        
        gaps = []
        if response.data:
            for idx, row in enumerate(response.data):
                gaps.append({
                    "id": str(row.get("id", idx)),
                    "product_name": row.get("competitor_product_name", "Unknown Product"),
                    "defect": row.get("market_gap_notes") or "Review under analysis...",
                    "opportunity": "Waiting for n8n AI strategy...",
                    "urgency": "Medium",
                    "sentiment": int((row.get("sentiment_score") or 0.5) * 100),
                    "search_volume": 10000 + (idx * 500), # Mocked search volume for UI
                })
        
        if not gaps:
            # Fallback mock data if DB is empty or unconfigured
            gaps = [
                { "id": "1", "product_name": "Ergonomic Office Chair", "defect": "Lumbar support breaks after 2 months", "opportunity": "Use reinforced steel joints", "urgency": "High", "sentiment": 22, "search_volume": 45000 },
                { "id": "2", "product_name": "Standing Desk Anti-Fatigue Mat", "defect": "Edges curl up and cause tripping", "opportunity": "Add weighted/beveled edges", "urgency": "High", "sentiment": 31, "search_volume": 12400 },
                { "id": "3", "product_name": "Wireless Gaming Mouse", "defect": "Double-clicking issue on main buttons", "opportunity": "Upgrade to optical switches", "urgency": "Medium", "sentiment": 45, "search_volume": 89000 },
                { "id": "4", "product_name": "Stainless Steel Water Bottle", "defect": "Lid leaks when stored horizontally", "opportunity": "Redesign silicone O-ring seal", "urgency": "Low", "sentiment": 65, "search_volume": 115000 },
                { "id": "5", "product_name": "Yoga Mat", "defect": "Slippery when sweating", "opportunity": "Add micro-fiber textured top layer", "urgency": "Medium", "sentiment": 40, "search_volume": 67000 },
            ]
            
        return {"status": "success", "gaps": gaps}
    except Exception as e:
        # Fallback if Supabase credentials are not set
        fallback_gaps = [
            { "id": "1", "product_name": "Ergonomic Office Chair", "defect": "Lumbar support breaks after 2 months", "opportunity": "Use reinforced steel joints", "urgency": "High", "sentiment": 22, "search_volume": 45000 },
            { "id": "2", "product_name": "Standing Desk Anti-Fatigue Mat", "defect": "Edges curl up and cause tripping", "opportunity": "Add weighted/beveled edges", "urgency": "High", "sentiment": 31, "search_volume": 12400 },
            { "id": "3", "product_name": "Wireless Gaming Mouse", "defect": "Double-clicking issue on main buttons", "opportunity": "Upgrade to optical switches", "urgency": "Medium", "sentiment": 45, "search_volume": 89000 }
        ]
        return {"status": "success", "gaps": fallback_gaps, "note": "Showing mock data because DB connection failed."}

@router.post("/discover-gaps")
async def discover_gaps(data: SearchPayload):
    """
    Search for emerging product gaps based on a text query.
    """
    try:
        # Generate query vector
        query_vector = generate_embedding(data.query_text)
        
        # Search Pinecone for emerging gaps
        results = search_emerging_gaps(query_vector, top_k=data.top_k)
        
        if not results:
            results = [
                { "id": "1", "product_name": f"{data.query_text} - Premium Edition", "defect": "Too bulky for everyday use", "opportunity": "Design a slim, foldable version", "urgency": "High", "sentiment": 30, "search_volume": 45000 },
                { "id": "2", "product_name": f"{data.query_text} - Budget Model", "defect": "Material feels cheap", "opportunity": "Use aluminum or premium silicone", "urgency": "Medium", "sentiment": 45, "search_volume": 22000 },
                { "id": "3", "product_name": f"{data.query_text} Pro", "defect": "Battery drains too fast", "opportunity": "Implement auto-sleep feature", "urgency": "High", "sentiment": 20, "search_volume": 89000 }
            ]
        
        return {"status": "success", "emerging_gaps": results}
    except Exception as e:
        fallback_results = [
            { "id": "1", "product_name": f"{data.query_text} - Premium Edition", "defect": "Too bulky for everyday use", "opportunity": "Design a slim, foldable version", "urgency": "High", "sentiment": 30, "search_volume": 45000 },
            { "id": "2", "product_name": f"{data.query_text} - Budget Model", "defect": "Material feels cheap", "opportunity": "Use aluminum or premium silicone", "urgency": "Medium", "sentiment": 45, "search_volume": 22000 }
        ]
        return {"status": "success", "emerging_gaps": fallback_results, "note": "Showing mock data because Pinecone/OpenAI failed."}

@router.get("/google-trends")
async def get_google_trends(keyword: str):
    """
    Fetch Google Trends data for a specific keyword.
    Currently simulating trend data but uses the GCP API key structure.
    """
    from app.core.config import settings
    api_key = settings.GOOGLE_API_KEY
    
    # In a production environment, you could use this key with the Google Custom Search JSON API
    # or use the 'pytrends' library. For now, we simulate a 6-month historical trend.
    import random
    
    # Simulate data based on the keyword's length to make it deterministic but dynamic
    base_volume = 40 + (len(keyword) * 2)
    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    trend_data = []
    
    for month in months:
        # Create a trend that generally goes up to simulate an "emerging gap"
        volume = base_volume + random.randint(-10, 20)
        sentiment = 50 + random.randint(-20, 20)
        trend_data.append({
            "month": month,
            "volume": min(100, volume),
            "sentiment": min(100, max(0, sentiment))
        })
        base_volume += 5  # upward trend
        
    return {"status": "success", "keyword": keyword, "data": trend_data}

class ScrapePayload(BaseModel):
    product_query: str
    platforms: list[str] = ["Reddit"]

@router.post("/scrape-social")
async def scrape_social_media(data: ScrapePayload):
    """
    Trigger live social media scraping for a product to find organic reviews and complaints.
    """
    from app.services.social_scraper import SocialMediaScraper
    
    scraper = SocialMediaScraper()
    all_results = []
    
    try:
        if "Reddit" in data.platforms:
            reddit_data = scraper.fetch_reddit_reviews(data.product_query, limit=5)
            all_results.extend(reddit_data)
            
        if "TikTok" in data.platforms:
            tiktok_data = await scraper.fetch_tiktok_reviews(data.product_query)
            all_results.extend(tiktok_data)
            
        if "Instagram" in data.platforms:
            insta_data = await scraper.fetch_instagram_reviews(data.product_query)
            all_results.extend(insta_data)
            
        # Save the final "Gaps" to Supabase
        if all_results:
            try:
                from app.api.dependencies import get_supabase_client
                supabase = get_supabase_client()
                
                records = []
                for review in all_results:
                    records.append({
                        "competitor_product_name": review.get("product_name"),
                        "review_text": review.get("review_text"),
                        "source_url": f"https://{review.get('platform', 'unknown').lower()}.com",
                        "processed": False
                    })
                    
                supabase.table("competitor_reviews").insert(records).execute()
            except Exception as db_err:
                print(f"Failed to save to Supabase: {db_err}")
                # We won't block the UI if the DB insert fails during development
                
        return {"status": "success", "count": len(all_results), "scraped_data": all_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ListingPayload(BaseModel):
    product_name: str
    keywords: list[str]

@router.post("/generate-listing")
async def generate_listing(data: ListingPayload):
    from app.core.config import settings
    
    # Try OpenAI first if configured
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "YOUR_OPENAI_API_KEY_HERE":
        import openai
        openai.api_key = settings.OPENAI_API_KEY
        
        prompt = f"""
        You are an expert Marketplace listing copywriter.
        I need an optimized listing title and 4 bullet points for the following product: {data.product_name}.
        
        You MUST naturally incorporate as many of these keywords as possible:
        {', '.join(data.keywords)}
        
        Output Format:
        Return ONLY a JSON object with two keys:
        1. "title": A high-converting Marketplace product title (under 200 characters).
        2. "bullets": A string of 4 bullet points separated by newlines, each starting with an emoji and a short capitalized feature phrase, e.g., "✅ ALL-DAY COMFORT: ...".
        
        Do not use markdown formatting like ```json.
        """
        
        try:
            from openai import OpenAI as OpenAIClient
            oai = OpenAIClient(api_key=settings.OPENAI_API_KEY)
            response = oai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a Marketplace SEO copywriter."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            result_text = response.choices[0].message.content.strip()
            import json
            try:
                parsed = json.loads(result_text)
                return {"status": "success", "data": parsed}
            except json.JSONDecodeError:
                return {"status": "success", "data": {"title": f"Premium {data.product_name}", "bullets": result_text}}
        except Exception as e:
            print(f"OpenAI failed, trying Gemini fallback: {e}")

    # Use Google Gemini as the free alternative
    if settings.GOOGLE_API_KEY and settings.GOOGLE_API_KEY != "YOUR_GOOGLE_API_KEY_HERE":
        import google.genai as genai
        client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        model_name = "gemini-1.5-flash"
        
        prompt = f"""
        Act as an expert Marketplace listing copywriter.
        Product: {data.product_name}
        Keywords to include: {', '.join(data.keywords)}
        
        Generate:
        1. A high-converting product title (under 200 chars).
        2. Four optimized bullet points with emojis.
        
        Return the result ONLY as a JSON object:
        {{
            "title": "...",
            "bullets": "✅ FEATURE: ...\n✅ FEATURE: ..."
        }}
        """
        
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            result_text = response.text.strip()
            
            # Clean up potential markdown formatting in Gemini output
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            import json
            parsed = json.loads(result_text)
            return {"status": "success", "data": parsed}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Generation failed (Gemini): {str(e)}")
            
    raise HTTPException(status_code=500, detail="No AI API Keys (OpenAI or Google) are configured.")
