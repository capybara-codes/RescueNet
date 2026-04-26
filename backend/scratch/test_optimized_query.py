import requests
import json

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def test_optimized_query():
    lat, lng = 28.6139, 77.2090
    radius = 15000 # 15km
    
    # Simpler tags, [out:json][timeout:60]
    query = f"""
    [out:json][timeout:60];
    (
      node["amenity"="social_facility"](around:{radius}, {lat}, {lng});
      node["office"="ngo"](around:{radius}, {lat}, {lng});
      node["office"="charity"](around:{radius}, {lat}, {lng});
      way["amenity"="social_facility"](around:{radius}, {lat}, {lng});
    );
    out center;
    """
    
    print(f"Testing optimized query for {lat}, {lng} with radius {radius}m...")
    try:
        response = requests.post(OVERPASS_URL, data={"data": query}, timeout=70)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            elements = data.get("elements", [])
            print(f"Total elements found: {len(elements)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_optimized_query()
