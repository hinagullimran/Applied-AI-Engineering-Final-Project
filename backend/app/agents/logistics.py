from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.logging import logger
import google.genai as genai
from app.core.config import settings

class LogisticsAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="LogisticsAgent")
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def run(self, sourcing_data: Dict[str, Any]) -> Dict[str, Any]:
        self.log_action("validate_manufacturer", {"manufacturer": sourcing_data.get("manufacturer_name")})
        
        target_price = sourcing_data.get("target_retail_price", 0)
        est_cost = sourcing_data.get("estimated_unit_cost", 0)
        
        # Margin logic
        margin = target_price - est_cost
        margin_percent = (margin / target_price) * 100 if target_price > 0 else 0
        
        prompt = f"""
        Validate the following manufacturer and calculate viability for a product with:
        Retail Price: ${target_price}
        Estimated Unit Cost: ${est_cost}
        Calculated Margin: {margin_percent:.2f}%
        
        Manufacturer Details:
        {sourcing_data.get("manufacturer_details")}
        
        Tasks:
        1. Rate authenticity (Low/Medium/High).
        2. Identify logistical risks (Shipping, Lead Times).
        3. Recommend a Go/No-Go decision based on a 30% margin threshold.
        """
        
        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )
            viability_report = response.text
            
            self.log_action("logistics_complete", {"viability": "assessed"})
            
            return {
                "viability_report": viability_report,
                "margin_analysis": {
                    "margin_dollars": margin,
                    "margin_percent": margin_percent
                },
                "status": "success"
            }
        except Exception as e:
            logger.error(f"LogisticsAgent error: {e}")
            return {"status": "error", "message": str(e)}
