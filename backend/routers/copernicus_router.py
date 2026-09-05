from fastapi import APIRouter, Depends
from copernicus import copernicus_service, WMSRequest
from auth import get_current_user
from models import User

router = APIRouter(prefix="/copernicus", tags=["copernicus"])

@router.post("/wms-url")
def get_wms_url(request: WMSRequest, current_user: User = Depends(get_current_user)):
    url = copernicus_service.get_wms_url(request)
    return {"url": url}
