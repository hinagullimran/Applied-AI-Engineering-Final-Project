from pydantic import BaseModel
from typing import Dict
from app.core.logging import logger

class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0

class CostMonitor:
    def __init__(self):
        # In production, this would use Redis for session-based tracking
        self.session_usage: Dict[str, TokenUsage] = {}
        
        # Approximate pricing (e.g., GPT-4o)
        self.PRICE_PER_1K_PROMPT = 0.005
        self.PRICE_PER_1K_COMPLETION = 0.015

    def track_usage(self, session_id: str, prompt_tokens: int, completion_tokens: int):
        if session_id not in self.session_usage:
            self.session_usage[session_id] = TokenUsage()
            
        usage = self.session_usage[session_id]
        usage.prompt_tokens += prompt_tokens
        usage.completion_tokens += completion_tokens
        usage.total_tokens += (prompt_tokens + completion_tokens)
        
        # Update cost
        usage.estimated_cost = (
            (usage.prompt_tokens / 1000) * self.PRICE_PER_1K_PROMPT +
            (usage.completion_tokens / 1000) * self.PRICE_PER_1K_COMPLETION
        )
        
        logger.info(f"Usage tracked for {session_id}: {usage.total_tokens} tokens", 
                    extra={"session_id": session_id, "cost": usage.estimated_cost})

cost_monitor = CostMonitor()
