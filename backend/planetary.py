import os
import requests
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

DATA_MODE = os.getenv("DATA_MODE", "mock")

class MapRequest(BaseModel):
    bbox: Optional[str] = "{bbox-epsg-3857}"
    time: Optional[str] = None
    layer: str = "TRUE_COLOR"

# --- Microsoft Planetary Computer STAC API Models ---

class SortExtension(BaseModel):
    field: str
    direction: str # "asc" | "desc"

class SearchPostRequest(BaseModel):
    collections: Optional[List[str]] = None
    ids: Optional[List[str]] = None
    bbox: Optional[List[float]] = None
    intersects: Optional[Dict[str, Any]] = None
    datetime: Optional[str] = None
    limit: Optional[int] = 250
    sortby: Optional[List[SortExtension]] = None
    query: Optional[Dict[str, Any]] = None
    
# --- Service ---

class PlanetaryComputerService:
    def __init__(self):
        self.mode = DATA_MODE

    def get_tile_url(self, request: MapRequest) -> str:
        if self.mode == "mock":
            if request.layer == "NDVI":
                return "https://a.tile.opentopomap.org/{z}/{x}/{y}.png"
            elif request.layer == "MOISTURE":
                return "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
            else:
                return "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        
        # Register a mosaic search for the sentinel-2-l2a collection.
        # We don't restrict by bbox here because MapLibre handles the spatial tiling automatically.
        mosaic_register_url = "https://planetarycomputer.microsoft.com/api/data/v1/mosaic/register"
        search_payload = {
            "collections": ["sentinel-2-l2a"]
        }
        
        try:
            resp = requests.post(mosaic_register_url, json=search_payload, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            search_id = data.get("searchid")
            
            if not search_id:
                print("Failed to get search_id from mosaic register")
                return ""
                
        except Exception as e:
            print(f"STAC Mosaic API error: {e}")
            # Fallback to a known search ID for sentinel-2-l2a if API fails
            search_id = "589feb14424441ea38fac0fc868c8747"

        # Construct Planetary Computer Data API mosaic tile URL
        base_tile_url = f"https://planetarycomputer.microsoft.com/api/data/v1/mosaic/{search_id}/tiles/WebMercatorQuad/{{z}}/{{x}}/{{y}}?collection=sentinel-2-l2a"
        
        if request.layer == "NDVI":
            # NDVI = (NIR - Red) / (NIR + Red) -> (B08 - B04) / (B08 + B04)
            return base_tile_url + "&asset_as_band=True&expression=(B08-B04)/(B08%2BB04)&colormap_name=rdylgn&rescale=-1,1"
        elif request.layer == "MOISTURE":
            # NDMI = (NIR - SWIR) / (NIR + SWIR) -> (B08 - B11) / (B08 + B11)
            return base_tile_url + "&asset_as_band=True&expression=(B08-B11)/(B08%2BB11)&colormap_name=rdbu&rescale=-1,1"
        else: # TRUE_COLOR
            return base_tile_url + "&assets=visual"

planetary_service = PlanetaryComputerService()
