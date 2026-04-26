import sys, os
sys.path.append(os.getcwd())
from utils.discovery import discover_nearby_ngos

def test_discovery():
    # Test locations
    locs = [
        {"name": "New Delhi (Urban)", "lat": 28.6139, "lng": 77.2090},
        {"name": "London (Capital)", "lat": 51.5074, "lng": -0.1278}
    ]

    for loc in locs:
        print(f"\n--- Testing Discovery in: {loc['name']} ---")
        res = discover_nearby_ngos(loc['lat'], loc['lng'], max_results=5)
        print(f"Search Radius Used: {res['radius_km']} km")
        print(f"NGOs Found: {len(res['ngos'])}")
        
        for i, ngo in enumerate(res['ngos']):
            print(f"{i+1}. {ngo['name']}")
            print(f"   Distance: {ngo['distance']:.2f} km")
            print(f"   Address: {ngo['address']}")
            print("-" * 20)

if __name__ == "__main__":
    test_discovery()
