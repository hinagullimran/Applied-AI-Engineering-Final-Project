from pinecone import Pinecone
from app.core.config import settings

def get_pinecone_client():
    if not settings.PINECONE_API_KEY:
        raise ValueError("Pinecone API key is not set.")
    return Pinecone(api_key=settings.PINECONE_API_KEY)

def get_pinecone_index():
    pc = get_pinecone_client()
    return pc.Index(settings.PINECONE_INDEX_NAME)

def search_emerging_gaps(query_vector: list[float], top_k: int = 10):
    """
    Perform a vector search on Pinecone to find 'emerging gaps' in market data.
    Rather than historical trends, this looks for recent signals.
    """
    index = get_pinecone_index()
    
    # Query Pinecone for the closest matching vectors.
    response = index.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True
    )
    
    # Analyze the response to filter out historical trends and focus on emerging gaps.
    # Heuristic: We look for items with high 'complaint_volume' or low 'satisfaction_score'
    emerging_gaps = []
    
    for match in response.matches:
        metadata = match.metadata or {}
        
        satisfaction_score = metadata.get('satisfaction_score', 1.0)
        is_historical_trend = metadata.get('is_historical_trend', False)
        
        # We define a gap as low satisfaction and NOT a historical trend
        if satisfaction_score < 0.6 and not is_historical_trend:
            emerging_gaps.append({
                "id": match.id,
                "score": match.score,
                "product_name": metadata.get("product_name"),
                "gap_signal": metadata.get("gap_signal", "Unknown")
            })
            
    return emerging_gaps

def upsert_market_data(item_id: str, vector: list[float], metadata: dict):
    """
    Insert or update scraped market data embeddings into Pinecone.
    """
    index = get_pinecone_index()
    index.upsert(vectors=[{"id": item_id, "values": vector, "metadata": metadata}])
