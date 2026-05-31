from typing import Any, Dict, List
from app.agents.base import BaseAgent
from app.core.logging import logger
import google.genai as genai
from app.core.config import settings

class CreativeAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="CreativeAgent")
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def run(self, product_context: Dict[str, Any]) -> Dict[str, Any]:
        self.log_action("generate_optimized_copy", {"product": product_context.get("name")})
        
        product_name = product_context.get("name")
        opportunity = product_context.get("opportunity")
        
        prompt = f"""
        Generate high-converting e-commerce listing copy for: '{product_name}'.
        Key Selling Point: {opportunity}
        
        Tasks:
        1. Create an A/B test simulation: Compare a "Benefit-Driven" vs "Fear-of-Missing-Out" title.
        2. Generate 5 bullet points focused on resolving the top customer pain points.
        3. Optimize for SEO keywords: premium, durable, problem-solving, top-rated.
        
        Return the result as a JSON-like structure with keys:
        - ab_test_simulation: {{ title_a: str, title_b: str, predicted_winner: str, reasoning: str }}
        - optimized_copy: {{ title: str, bullets: List[str] }}
        """
        
        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )
            copy_results = response.text
            
            self.log_action("creative_complete", {"status": "success"})
            
            return {
                "product_name": product_name,
                "listing_optimization": copy_results,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"CreativeAgent error: {e}")
            return {"status": "error", "message": str(e)}
