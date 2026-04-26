import math, os, requests
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()
# Removed top-level ORS_API_KEY to ensure it re-reads from environment correctly

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Mathematical fallback: Haversine distance in km."""
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    return c * 6371

def find_nearest_entities(source_lat: float, source_lng: float, entities: List[Dict], limit: int = 3) -> List[Dict]:
    """
    Finds nearest entities using OpenRouteService Matrix API for road distance.
    Falls back to Haversine if ORS is unavailable.
    """
    if not entities:
        return []

    # Filter entities with valid coordinates
    valid_entities = [e for e in entities if e.get("lat") and e.get("lng")]
    if not valid_entities:
        return []

    # Attempt ORS Matrix calculation
    api_key = os.getenv("ORS_API_KEY")
    if api_key and api_key != "your_key_here":
        try:
            # ORS expects [longitude, latitude]
            locations = [[source_lng, source_lat]] + [[e["lng"], e["lat"]] for e in valid_entities]
            body = {
                "locations": locations,
                "sources": [0],
                "destinations": list(range(1, len(locations))),
                "metrics": ["distance", "duration"]
            }
            
            headers = {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Authorization': api_key,
                'Content-Type': 'application/json; charset=utf-8'
            }
            
            response = requests.post(
                'https://api.openrouteservice.org/v2/matrix/driving-car', 
                json=body, 
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                # distances are in meters from ORS, convert to km
                distances = data.get("distances", [[]])[0]
                durations = data.get("durations", [[]])[0]
                
                scored = []
                for i, entity in enumerate(valid_entities):
                    dist_km = (distances[i] / 1000.0) if i < len(distances) else calculate_distance(source_lat, source_lng, entity["lat"], entity["lng"])
                    dur_min = (durations[i] / 60.0) if i < len(durations) else (dist_km / 30.0 * 60)
                    
                    scored.append({
                        **entity,
                        "distance": dist_km,
                        "duration_min": round(dur_min, 1)
                    })
                
                scored.sort(key=lambda x: x["distance"])
                return scored[:limit]
            else:
                print(f"ORS API Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"ORS Calculation failed (falling back to Haversine): {e}")

    # Fallback: Haversine
    scored = []
    for entity in valid_entities:
        dist = calculate_distance(source_lat, source_lng, entity["lat"], entity["lng"])
        scored.append({
            **entity,
            "distance": dist,
            "duration_min": round(dist / 30.0 * 60, 1) # simple estimate
        })
    
    scored.sort(key=lambda x: x["distance"])
    return scored[:limit]
