from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
from app.core.logging import logger

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
        logger.info(f"WebSocket connected for client: {client_id}")

    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        logger.info(f"WebSocket disconnected for client: {client_id}")

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                await connection.send_text(message)

    async def broadcast_status(self, client_id: str, agent_name: str, status: str, details: str = ""):
        message = json.dumps({
            "type": "agent_status",
            "agent": agent_name,
            "status": status,
            "details": details
        })
        await self.send_personal_message(message, client_id)

ws_manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await ws_manager.connect(websocket, client_id)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo or handle commands
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, client_id)
