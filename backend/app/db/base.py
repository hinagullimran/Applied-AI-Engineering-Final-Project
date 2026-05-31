from typing import Any, List, Optional
from app.core.config import settings
from supabase import create_client, Client

class BaseRepository:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_KEY
        )

    def get_session(self):
        # In a real app, this might return a DB session or handle transactions
        return self.supabase
