from typing import Any, Dict
from app.agents.research import ResearchAgent
from app.agents.analysis import AnalysisAgent
from app.agents.creative import CreativeAgent
from app.agents.sentiment import SentimentAgent
from app.agents.logistics import LogisticsAgent
from app.api.routes.websockets import ws_manager
from app.core.logging import logger

class CatalystManager:
    def __init__(self):
        self.research_agent = ResearchAgent()
        self.analysis_agent = AnalysisAgent()
        self.creative_agent = CreativeAgent()
        self.sentiment_agent = SentimentAgent()
        self.logistics_agent = LogisticsAgent()

    async def discover_opportunity(self, category: str, client_id: str = None) -> Dict[str, Any]:
        logger.info(f"Manager initiating discovery pipeline for: {category}")
        
        if client_id:
            await ws_manager.broadcast_status(client_id, "Manager", "starting", f"Initializing discovery for {category}")

        # 1. Research Phase
        if client_id:
            await ws_manager.broadcast_status(client_id, "ResearchAgent", "running", "Scraping social trends and pain points")
        research_results = await self.research_agent.run(category)
        if research_results["status"] == "error":
            if client_id:
                await ws_manager.broadcast_status(client_id, "ResearchAgent", "error", research_results["message"])
            return research_results
            
        if client_id:
            await ws_manager.broadcast_status(client_id, "AnalysisAgent", "running", "Scoring market viability and product gaps")
        final_report = await self.analysis_agent.run(research_results)
        
        # 3. Creative/Optimization Phase
        if client_id:
            await ws_manager.broadcast_status(client_id, "CreativeAgent", "running", "Generating A/B test simulations and optimized copy")
        creative_results = await self.creative_agent.run({
            "name": category,
            "opportunity": research_results.get("synthesis")
        })

        # 4. Logistics & Sourcing Phase
        if client_id:
            await ws_manager.broadcast_status(client_id, "LogisticsAgent", "running", "Validating manufacturers and margin viability")
        logistics_results = await self.logistics_agent.run({
            "target_retail_price": 49.99, # Placeholder
            "estimated_unit_cost": 15.00, # Placeholder
            "manufacturer_details": "Shenzhen Manufacturing Hub"
        })

        if client_id:
            await ws_manager.broadcast_status(client_id, "Manager", "complete", "Full production pipeline finished")

        # 5. Consolidate and return
        return {
            "category": category,
            "research": research_results,
            "analysis": final_report,
            "creative": creative_results,
            "logistics": logistics_results,
            "pipeline_status": "complete"
        }

manager = CatalystManager()
