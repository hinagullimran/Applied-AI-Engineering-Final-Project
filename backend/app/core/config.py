from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Catalyst"
    
    # Supabase Settings
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # Pinecone Settings
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX_NAME: str = "catalyst-index"

    # OpenAI Settings
    OPENAI_API_KEY: str = ""

    # Google Settings (e.g. for Trends or SERP API)
    GOOGLE_API_KEY: str = ""
    # Bright Data Settings
    BRIGHTDATA_TOKEN: str = ""
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
