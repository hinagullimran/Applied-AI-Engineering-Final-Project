from fastapi import APIRouter, Depends
from typing import List

router = APIRouter()

@router.get("/")
def get_products():
    """
    Retrieve trending products.
    """
    return {"products": []}
