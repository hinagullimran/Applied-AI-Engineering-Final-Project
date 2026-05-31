from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """
    Dependency to get Supabase client.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise ValueError("Supabase credentials not configured.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
