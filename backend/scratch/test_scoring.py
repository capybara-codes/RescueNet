import sys, os
sys.path.append(os.getcwd())
from utils.rescue_score import calculate_rescue_score
from datetime import datetime, timedelta

def test():
    # Helper to get ISO time
    def get_iso(hours_ahead):
        return (datetime.utcnow() + timedelta(hours=hours_ahead)).isoformat() + "Z"

    scenarios = [
        {
            "name": "Expires Tomorrow (23h) + Fresh + Very Close",
            "args": {
                "expires_at": get_iso(23),
                "quantity_kg": 5,
                "food_type": "Fresh cooked meal",
                "distance_km": 0.5
            },
            "expected_priority": "medium"
        },
        {
            "name": "Expires Soon (3h) + Large + Close",
            "args": {
                "expires_at": get_iso(3),
                "quantity_kg": 30,
                "food_type": "Cooked rice",
                "distance_km": 1.5
            },
            "expected_priority": "high"
        },
        {
            "name": "Far Future (47h) + Small + Far",
            "args": {
                "expires_at": get_iso(47),
                "quantity_kg": 2,
                "food_type": "Canned beans",
                "distance_km": 20.0
            },
            "expected_priority": "low"
        }
    ]

    print("--- RESCUE SCORE VERIFICATION ---")
    for s in scenarios:
        res = calculate_rescue_score(**s["args"])
        status = "PASSED" if res["priority"] == s["expected_priority"] else "FAILED"
        print(f"[{status}] {s['name']}")
        print(f"      Score: {res['score']}, Priority: {res['priority']}")
        print(f"      Reason: {res['reason']}")
        print("-" * 30)

if __name__ == "__main__":
    test()
