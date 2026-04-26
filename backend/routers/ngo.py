from fastapi import APIRouter, HTTPException, Header
from firebase_admin_init import get_db, verify_token

router = APIRouter(prefix="/ngo", tags=["ngo"])


def _require_auth(authorization: str):
    token = authorization.replace("Bearer ", "")
    try:
        return verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/available-donations")
async def available_donations(authorization: str = Header(...)):
    """All donations with status=available, ordered by rescue priority."""
    _require_auth(authorization)
    db = get_db()
    # Support legacy "available" along with new "created" and "pending_match" statuses
    docs = db.collection("donations").where("status", "in", ["available", "created", "pending_match"]).stream()
    results = [d.to_dict() for d in docs]
    priority_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 3))
    return results


@router.post("/accept/{donation_id}")
async def accept_donation(donation_id: str, authorization: str = Header(...)):
    """NGO accepts a donation — marks it as accepted + links their UID."""
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()

    doc_ref = db.collection("donations").document(donation_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Donation not found")
    if doc.to_dict().get("status") not in ["available", "created", "pending_match"]:
        raise HTTPException(status_code=400, detail="Donation is no longer available")

    import datetime
    doc_ref.update({
        "status": "accepted",
        "ngo_uid": uid,
        "updated_at": datetime.datetime.utcnow().isoformat(),
    })
    return {"message": "Donation accepted"}


@router.post("/reject/{donation_id}")
async def reject_donation(donation_id: str, authorization: str = Header(...)):
    """NGO rejects — donation goes back to available."""
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()

    doc_ref = db.collection("donations").document(donation_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Donation not found")
    data = doc.to_dict()
    if data.get("ngo_uid") != uid:
        raise HTTPException(status_code=403, detail="Not your accepted donation")

    import datetime
    doc_ref.update({
        "status": "pending_match",
        "ngo_uid": None,
        "updated_at": datetime.datetime.utcnow().isoformat(),
    })
    return {"message": "Donation rejected — back to pool"}


@router.get("/my-accepted")
async def my_accepted(authorization: str = Header(...)):
    """Donations accepted by this NGO."""
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()
    docs = db.collection("donations").where("ngo_uid", "==", uid).stream()
    return [d.to_dict() for d in docs]


@router.get("/locations")
async def ngo_locations(lat: float = None, lng: float = None, authorization: str = Header(...)):
    """Fetch nearby NGOs for proximity map. Generates mocks around lat/lng for demo mode."""
    decoded = _require_auth(authorization)
    
    if decoded.get("is_demo"):
        from utils.discovery import discover_nearby_ngos
        discovery = discover_nearby_ngos(lat or 28.6139, lng or 77.2090, max_results=30)
        return discovery["ngos"]

    db = get_db()
    docs = db.collection("users").where("role", "==", "ngo").stream()
    local_ngos = []
    for d in docs:
        data = d.to_dict()
        if data.get("lat") and data.get("lng"):
            local_ngos.append({
                "uid": data.get("uid"),
                "name": data.get("name") or data.get("organization"),
                "phone": data.get("phone", "N/A"),
                "lat": data.get("lat"),
                "lng": data.get("lng"),
                "address": data.get("address", ""),
                "is_external": False
            })
            
    # Also fetch external discovery for real-world context even in production
    from utils.discovery import discover_nearby_ngos
    discovery = discover_nearby_ngos(lat or 28.6139, lng or 77.2090, max_results=20)
    return local_ngos + discovery["ngos"]
