"""
Reward points and badge utilities for RescueNet AI.
"""
from datetime import datetime

BADGES = [
    {"id": "first_rescue", "name": "First Rescue", "icon": "🌱", "points_required": 10},
    {"id": "green_starter", "name": "Green Starter", "icon": "🌿", "points_required": 50},
    {"id": "food_hero", "name": "Food Hero", "icon": "🦸", "points_required": 150},
    {"id": "eco_warrior", "name": "Eco Warrior", "icon": "⚡", "points_required": 300},
    {"id": "rescue_legend", "name": "Rescue Legend", "icon": "🏆", "points_required": 600},
]


def get_initial_rewards() -> dict:
    return {
        "points": 0,
        "badges": [],
        "streak": 0,
        "last_activity": None,
        "total_donations": 0,
        "total_pickups": 0,
        "total_deliveries": 0,
    }


def compute_badges(points: int) -> list:
    return [b["id"] for b in BADGES if points >= b["points_required"]]


def add_points(db, uid: str, amount: int, reason: str = "") -> dict:
    """
    Add points to a user's reward profile.
    Recalculates badges and streak. Returns updated rewards dict.
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        return {}

    user = user_doc.to_dict()
    rewards = user.get("rewards", get_initial_rewards())

    old_points = rewards.get("points", 0)
    new_points = old_points + amount
    rewards["points"] = new_points

    # Update badges
    rewards["badges"] = compute_badges(new_points)

    # Update streak (simple daily streak)
    today = datetime.utcnow().date().isoformat()
    last_activity = rewards.get("last_activity")
    if last_activity:
        last_date = last_activity[:10]
        from datetime import date, timedelta
        yesterday = (date.fromisoformat(today) - timedelta(days=1)).isoformat()
        if last_date == yesterday:
            rewards["streak"] = rewards.get("streak", 0) + 1
        elif last_date != today:
            rewards["streak"] = 1
    else:
        rewards["streak"] = 1

    rewards["last_activity"] = datetime.utcnow().isoformat()

    # Update counters based on reason
    if "Donation" in reason:
        rewards["total_donations"] = rewards.get("total_donations", 0) + 1
    if "Pickup" in reason:
        rewards["total_pickups"] = rewards.get("total_pickups", 0) + 1
    if "Delivery" in reason:
        rewards["total_deliveries"] = rewards.get("total_deliveries", 0) + 1

    user_ref.update({"rewards": rewards})
    return rewards
