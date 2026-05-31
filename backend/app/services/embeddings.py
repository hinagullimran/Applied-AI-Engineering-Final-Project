from openai import OpenAI
from app.core.config import settings

def generate_embedding(text: str) -> list[float]:
    """
    Generate an embedding for the given text using OpenAI's embedding model.
    Falls back to a zero vector if OpenAI is not configured.
    """
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "YOUR_OPENAI_API_KEY_HERE":
        # Return a dummy 1536-dim zero vector as fallback (text-embedding-ada-002 dimension)
        return [0.0] * 1536

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding
