from fastapi import APIRouter, HTTPException, Header
from firebase_admin_init import get_db, verify_token

router = APIRouter(prefix="/impact", tags=["impact"])


def _require_auth(authorization: str):
    token = authorization.replace("Bearer ", "")
    try:
        return verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/stats")
async def impact_stats(authorization: str = Header(...)):
    """Compute platform-wide impact statistics from Firestore."""
    _require_auth(authorization)
    db = get_db()

    donations = [d.to_dict() for d in db.collection("donations").stream()]
    users = [u.to_dict() for u in db.collection("users").stream()]

    total_donations = len(donations)
    delivered = [d for d in donations if d.get("status") == "delivered"]
    kg_saved = sum(d.get("quantity_kg", 0) for d in delivered)
    meals_rescued = int(kg_saved / 0.4)  # ~0.4 kg per meal
    co2_reduced = round(kg_saved * 2.5, 1)  # ~2.5 kg CO2 per kg food waste avoided

    active_donors = len({d.get("donor_uid") for d in donations if d.get("donor_uid")})
    active_volunteers = len({d.get("volunteer_uid") for d in delivered if d.get("volunteer_uid")})
    active_ngos = len({d.get("ngo_uid") for d in delivered if d.get("ngo_uid")})

    # Recent trend (last 7 days placeholder — use real timestamps in prod)
    trend = [
        {"day": "Mon", "kg": 82},
        {"day": "Tue", "kg": 110},
        {"day": "Wed", "kg": 95},
        {"day": "Thu", "kg": 135},
        {"day": "Fri", "kg": 160},
        {"day": "Sat", "kg": 210},
        {"day": "Sun", "kg": 180},
    ]

    return {
        "total_donations": total_donations,
        "completed_deliveries": len(delivered),
        "kg_food_saved": round(kg_saved, 1),
        "meals_rescued": meals_rescued,
        "co2_reduced_kg": co2_reduced,
        "active_donors": active_donors,
        "active_volunteers": active_volunteers,
        "active_ngos": active_ngos,
        "total_users": len(users),
        "weekly_trend": trend,
    }
