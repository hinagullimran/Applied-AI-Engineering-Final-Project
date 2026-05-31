import asyncio
from app.worker.celery_app import celery_app
from app.agents.manager import manager
from app.core.logging import logger

@celery_app.task(name="tasks.discover_market_opportunity")
def discover_market_opportunity(category: str, client_id: str = None):
    logger.info(f"Background task started for category: {category} (Client: {client_id})")
    
    # Run the async agent pipeline in a sync celery worker
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(manager.discover_opportunity(category, client_id))
    
    # In a real app, we would save the result to Supabase here
    # self.db.save_report(result)
    
    logger.info(f"Background task complete for category: {category}")
    return result
