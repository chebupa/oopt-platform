import os
import requests
from pydantic import BaseModel
from typing import Optional

DATA_MODE = os.getenv("DATA_MODE", "mock")
COPERNICUS_USERNAME = os.getenv("COPERNICUS_USERNAME", "")
COPERNICUS_PASSWORD = os.getenv("COPERNICUS_PASSWORD", "")
COPERNICUS_INSTANCE_ID = os.getenv("COPERNICUS_INSTANCE_ID", "")

class WMSRequest(BaseModel):
    bbox: Optional[str] = "{bbox-epsg-3857}"
    time: Optional[str] = None
    layer: str = "TRUE_COLOR"

class CopernicusService:
    def __init__(self):
        self.mode = DATA_MODE
        self.auth_token = None

    def get_wms_url(self, request: WMSRequest) -> str:
        bbox_param = request.bbox or "{bbox-epsg-3857}"
        if self.mode == "mock":
            # Return public Sentinel-2 WMS with tile placeholder
            layer_name = "s2cloudless-2020"
            base_url = "https://tiles.maps.eox.at/wms"
            params = f"?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS={layer_name}&SRS=EPSG:3857&BBOX={bbox_param}&WIDTH=256&HEIGHT=256&FORMAT=image/jpeg"
            return base_url + params
        else:
            instance_id = COPERNICUS_INSTANCE_ID or COPERNICUS_USERNAME
            if not self.auth_token:
                self.authenticate()

            base_url = f"https://sh.dataspace.copernicus.eu/ogc/wms/{instance_id}"
            params = f"?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS={request.layer}&SRS=EPSG:3857&BBOX={bbox_param}&WIDTH=256&HEIGHT=256&FORMAT=image/png"
            if request.time:
                params += f"&TIME={request.time}"
            if self.auth_token and self.auth_token != "mock_token_due_to_error":
                params += f"&token={self.auth_token}"
            return base_url + params

    def authenticate(self):
        # Obtain Keycloak token for Copernicus Data Space Ecosystem
        url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
        if COPERNICUS_USERNAME.startswith("sh-") or "@" not in COPERNICUS_USERNAME:
            data = {
                "client_id": COPERNICUS_USERNAME,
                "client_secret": COPERNICUS_PASSWORD,
                "grant_type": "client_credentials",
            }
        else:
            data = {
                "client_id": "cdse-public",
                "username": COPERNICUS_USERNAME,
                "password": COPERNICUS_PASSWORD,
                "grant_type": "password",
            }
        try:
            response = requests.post(url, data=data, timeout=10)
            response.raise_for_status()
            self.auth_token = response.json().get("access_token")
        except Exception as e:
            print(f"Failed to authenticate with Copernicus: {e}")
            self.auth_token = "mock_token_due_to_error"

copernicus_service = CopernicusService()
