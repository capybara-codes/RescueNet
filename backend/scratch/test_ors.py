import sys, os, requests
from dotenv import load_dotenv

# Load environment before any other imports that might use it
load_dotenv()

sys.path.append(os.getcwd())
try:
    from utils.matching import find_nearest_entities
except ImportError:
    print("[ERROR] Could not import utils.matching. Make sure you are running from the backend directory.")
    sys.exit(1)

def test_ors():
    # Mock data for NGOs (New Delhi area)
    source_lat, source_lng = 28.6139, 77.2090
    ngos = [
        {"uid": "ngo1", "name": "Delhi Food Bank", "lat": 28.6339, "lng": 77.2190},
        {"uid": "ngo2", "name": "Noida Relief", "lat": 28.5339, "lng": 77.3890},
        {"uid": "ngo3", "name": "Gurugram Care", "lat": 28.4595, "lng": 77.0266}
    ]

    print("--- ORS MATRIX VERIFICATION ---")
    key = os.getenv("ORS_API_KEY")
    if not key or key == "your_key_here":
        print("[WARNING] No ORS_API_KEY found. Falling back to Haversine mode.")
    
    results = find_nearest_entities(source_lat, source_lng, ngos, limit=3)
    
    for i, res in enumerate(results):
        print(f"{i+1}. {res['name']}")
        print(f"   Distance: {res['distance']:.2f} km")
        print(f"   ETA: {res['duration_min']} mins")
        print(f"   Coordinates: {res['lat']}, {res['lng']}")
        print("-" * 20)

if __name__ == "__main__":
    test_ors()
