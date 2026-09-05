from fastapi import APIRouter, Depends
from planetary import planetary_service, MapRequest
from auth import get_current_user
from models import User

router = APIRouter(prefix="/planetary", tags=["planetary"])

@router.post("/tile-url")
def get_tile_url(request: MapRequest, current_user: User = Depends(get_current_user)):
    url = planetary_service.get_tile_url(request)
    return {"url": url}

