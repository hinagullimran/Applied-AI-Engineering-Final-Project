from abc import ABC, abstractmethod
from typing import Any, Dict
from app.core.logging import logger

class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def run(self, input_data: Any) -> Dict[str, Any]:
        """Execute the agent logic."""
        pass

    def log_action(self, action: str, details: Dict[str, Any] = None):
        logger.info(f"Agent {self.name} action: {action}", extra={
            "agent_name": self.name,
            "action": action,
            "details": details
        })
