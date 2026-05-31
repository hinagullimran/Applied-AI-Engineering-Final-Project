from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.logging import logger
import google.genai as genai
from app.core.config import settings

class AnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="AnalysisAgent")
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def run(self, research_data: Dict[str, Any]) -> Dict[str, Any]:
        self.log_action("start_analysis", {"category": research_data.get("category")})
        
        category = research_data.get("category")
        synthesis = research_data.get("synthesis")
        
        # Scoring logic
        prompt = f"""
        Analyze the following research for '{category}' and identify 3 specific high-opportunity market gaps.
        
        Research Synthesis:
        {synthesis}
        
        Return exactly a JSON list of objects with this schema:
        [
          {{
            "id": "unique-uuid",
            "product_name": "string",
            "defect": "the top physical complaint from reviews",
            "opportunity": "the engineered solution/feature gap",
            "sentiment": integer (0-100),
            "emotional_triggers": ["string", "string"],
            "score": float (0-1)
          }}
        ]
        """
        
        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )
            raw_text = response.text
            import json
            import re
            
            # Simple regex to find JSON array
            json_match = re.search(r'\[.*\]', raw_text, re.DOTALL)
            if json_match:
                gaps = json.loads(json_match.group())
            else:
                gaps = []

            self.log_action("analysis_complete", {"gaps_found": len(gaps)})
            
            return {
                "category": category,
                "opportunity_score": raw_text,
                "gaps": gaps,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"AnalysisAgent error: {e}")
            return {"status": "error", "message": str(e)}
