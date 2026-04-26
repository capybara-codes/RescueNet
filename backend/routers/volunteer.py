from fastapi import APIRouter, HTTPException, Header
from firebase_admin_init import get_db, verify_token
from utils.rewards import add_points
from utils.notifications import notify_user
import datetime

router = APIRouter(prefix="/volunteer", tags=["volunteer"])


def _require_auth(authorization: str):
    token = authorization.replace("Bearer ", "")
    try:
        return verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/missions")
async def available_missions(authorization: str = Header(...)):
    """Donations accepted by NGO but not yet assigned to a volunteer."""
    _require_auth(authorization)
    db = get_db()
    docs = db.collection("donations").where("status", "==", "accepted").stream()
    results = [d.to_dict() for d in docs]
    priority_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 3))
    return results


@router.post("/accept/{donation_id}")
async def accept_mission(donation_id: str, authorization: str = Header(...)):
    """Volunteer accepts a pickup mission."""
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()

    doc_ref = db.collection("donations").document(donation_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Donation not found")
    if doc.to_dict().get("status") != "accepted":
        raise HTTPException(status_code=400, detail="Mission not available")

    # Could calculate ETA if volunteer's lat/lng is passed. Mocking for now.
    doc_ref.update({
        "status": "volunteer_assigned",
        "volunteer_uid": uid,
        "eta_minutes": 15, # Example mockup
        "updated_at": datetime.datetime.utcnow().isoformat(),
    })
    add_points(db, uid, 5, "Mission accepted")
    notify_user(db, doc.to_dict().get("donor_uid", ""), "Volunteer Assigned", "A volunteer is on their way!")
    return {"message": "Mission accepted", "eta_minutes": 15}


@router.post("/pickup/{donation_id}")
async def mark_picked_up(donation_id: str, authorization: str = Header(...)):
    """Volunteer marks food as picked up."""
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()

    doc_ref = db.collection("donations").document(donation_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Donation not found")
    data = doc.to_dict()
    if data.get("volunteer_uid") != uid:
        raise HTTPException(status_code=403, detail="Not your mission")
    if data.get("status") != "volunteer_assigned":
        raise HTTPException(status_code=400, detail="Invalid status transition")

    doc_ref.update({
        "status": "picked_up",
        "picked_up_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    })
    add_points(db, uid, 15, "Pickup completed")
    notify_user(db, data.get("ngo_uid", ""), "Food Picked Up!", "Volunteer has picked up the food.")
    return {"message": "Marked as picked up"}


@router.post("/deliver/{donation_id}")
async def mark_delivered(donation_id: str, authorization: str = Header(...)):
    """Volunteer marks delivery as complete."""
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()

    doc_ref = db.collection("donations").document(donation_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Donation not found")
    data = doc.to_dict()
    if data.get("volunteer_uid") != uid:
        raise HTTPException(status_code=403, detail="Not your mission")
    if data.get("status") != "picked_up":
        raise HTTPException(status_code=400, detail="Invalid status transition")

    doc_ref.update({
        "status": "delivered",
        "delivered_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
    })
    add_points(db, uid, 25, "Delivery completed")
    
    notify_user(db, data.get("donor_uid", ""), "Delivery Completed", "Your food donation has successfully reached the NGO!")
    notify_user(db, data.get("ngo_uid", ""), "Food Delivered!", "The volunteer has dropped off the food.")
    
    return {"message": "Delivery completed! +25 points"}


@router.get("/my-missions")
async def my_missions(authorization: str = Header(...)):
    """All missions for this volunteer."""
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()
    docs = db.collection("donations").where("volunteer_uid", "==", uid).stream()
    return [d.to_dict() for d in docs]


@router.get("/leaderboard")
async def leaderboard(authorization: str = Header(...)):
    """Top 10 volunteers by reward points."""
    _require_auth(authorization)
    db = get_db()
    docs = db.collection("users").where("role", "==", "volunteer").stream()
    volunteers = [d.to_dict() for d in docs]
    volunteers.sort(key=lambda x: x.get("rewards", {}).get("points", 0), reverse=True)
    return volunteers[:10]
