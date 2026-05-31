from typing import Any, Dict, List
from app.agents.base import BaseAgent
from app.services.social_scraper import SocialMediaScraper
from app.core.logging import logger
import google.genai as genai
from app.core.config import settings

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="ResearchAgent")
        self.scraper = SocialMediaScraper()
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def run(self, category: str) -> Dict[str, Any]:
        self.log_action("start_research", {"category": category})
        
        # 1. Fetch raw data from multiple sources
        reddit_data = self.scraper.fetch_reddit_reviews(category, limit=5)
        tiktok_data = await self.scraper.fetch_tiktok_reviews(category)
        
        all_raw_data = reddit_data + tiktok_data
        
        # 2. Synthesize trends using Gemini
        prompt = f"""
        Analyze the following raw social media data for the category: '{category}'.
        Identify emerging product trends, common pain points, and potential market gaps.
        
        Raw Data:
        {all_raw_data}
        
        Return a JSON object with:
        - trends: List of identified trends
        - pain_points: List of consumer frustrations
        - potential_products: List of product ideas that could fill the gaps
        """
        
        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )
            synthesis = response.text
            
            self.log_action("research_complete", {"trends_count": len(all_raw_data)})
            
            return {
                "category": category,
                "raw_data_points": len(all_raw_data),
                "synthesis": synthesis,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"ResearchAgent error: {e}", extra={"category": category})
            return {"status": "error", "message": str(e)}
