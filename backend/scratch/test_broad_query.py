import requests
import json

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def test_broad_query():
    # New Delhi
    lat, lng = 28.6139, 77.2090
    radius = 15000 # 15km
    
    # Using 'nwr' to find Node, Way, and Relation
    # Using regex for flexible tag matching
    query = f"""
    [out:json][timeout:30];
    (
      nwr["amenity"~"social_facility|food_bank|social_centre|community_centre"](around:{radius}, {lat}, {lng});
      nwr["office"~"ngo|charity|foundation|association"](around:{radius}, {lat}, {lng});
      nwr["social_facility"~"food|soup|pantry"](around:{radius}, {lat}, {lng});
    );
    out center;
    """
    
    print(f"Testing broad query for {lat}, {lng} with radius {radius}m...")
    try:
        response = requests.post(OVERPASS_URL, data={"data": query}, timeout=35)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            elements = data.get("elements", [])
            print(f"Total elements found: {len(elements)}")
            for el in elements[:5]:
                tags = el.get("tags", {})
                print(f"- {tags.get('name', 'Unnamed')} ({el.get('type')})")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_broad_query()
