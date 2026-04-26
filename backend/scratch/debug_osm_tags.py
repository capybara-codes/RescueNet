import requests
import json

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def debug_delhi():
    lat, lng = 28.6139, 77.2090
    radius = 2000 # 2km
    
    # Just get anything with a name to see the tagging style
    query = f"""
    [out:json][timeout:30];
    nwr(around:{radius}, {lat}, {lng})["name"];
    out center 10;
    """
    
    print(f"Debugging OSM tags in Delhi around {lat}, {lng}...")
    try:
        response = requests.post(OVERPASS_URL, data={"data": query}, timeout=35)
        if response.status_code == 200:
            data = response.json()
            elements = data.get("elements", [])
            print(f"Found {len(elements)} named elements. First few:")
            for el in elements:
                tags = el.get("tags", {})
                print(f"- {tags.get('name')} | {list(tags.keys())}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug_delhi()
