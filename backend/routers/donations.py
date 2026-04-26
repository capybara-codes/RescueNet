from fastapi import APIRouter, HTTPException, Header
from firebase_admin_init import get_db, verify_token
from models import DonationCreate, DonationUpdate, DonationStatus
from utils.rescue_score import calculate_rescue_score
from utils.rewards import add_points
from utils.notifications import notify_user
from utils.matching import find_nearest_entities, calculate_distance
import datetime, uuid

router = APIRouter(prefix="/donations", tags=["donations"])


def _require_auth(authorization: str):
    token = authorization.replace("Bearer ", "")
    try:
        return verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/")
async def create_donation(payload: DonationCreate, authorization: str = Header(...)):
    print(f"DEBUG: Received donation request. Payload: {payload.dict()}")
    try:
        decoded = _require_auth(authorization)
        uid = decoded["uid"]
        db = get_db()

        # Find nearest NGOs to inform the rescue score
        ngos = []
        for ngo_doc in db.collection("users").where("role", "==", "ngo").stream():
            nd = ngo_doc.to_dict()
            if nd.get("lat") and nd.get("lng"):
                ngos.append(nd)
                
        nearest_ngos = find_nearest_entities(payload.lat, payload.lng, ngos, limit=3)
        closest_distance = nearest_ngos[0]["distance"] if nearest_ngos else None

        # Calculate final rescue score with distance context
        score_data = calculate_rescue_score(
            expires_at=payload.expires_at,
            quantity_kg=payload.quantity_kg,
            food_type=payload.food_type,
            prepared_at=payload.prepared_at,
            distance_km=closest_distance
        )

        donation_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow().isoformat()

        donation = {
            "id": donation_id,
            "donor_uid": uid,
            "food_type": payload.food_type,
            "quantity_kg": payload.quantity_kg,
            "is_vegetarian": payload.is_vegetarian,
            "prepared_at": payload.prepared_at,
            "expires_at": payload.expires_at,
            "address": payload.address,
            "lat": payload.lat,
            "lng": payload.lng,
            "is_packed": payload.is_packed,
            "notes": payload.notes,
            "status": DonationStatus.created,
            "priority": score_data["priority"],
            "rescue_score": score_data["score"],
            "rescue_reason": score_data["reason"],
            "volunteer_uid": None,
            "ngo_uid": None,
            "created_at": now,
            "updated_at": now,
        }

        # Handle suggest_uids for matching
        suggested_uids = [ngo["uid"] for ngo in nearest_ngos]
        if suggested_uids:
            donation["suggested_ngos"] = suggested_uids

        db.collection("donations").document(donation_id).set(donation)
        print(f"DEBUG: Donation {donation_id} created in Firestore with priority {score_data['priority']}.")

        # Award donor points
        add_points(db, uid, 10, "Donation created")
        
        # Notify the NGOs found
        for ngo_uid in suggested_uids:
            notify_user(
                db, 
                ngo_uid, 
                "Urgent: New Donation Nearby!", 
                f"A {score_data['priority'].upper()} priority {payload.quantity_kg}kg donation is available nearby. Accept it now."
            )
            
        # Notify donor
        notify_user(db, uid, "Donation Created", f"Your donation of {payload.quantity_kg}kg is live! ({score_data['priority']} priority). Notified {len(suggested_uids)} nearby NGOs.")

        return donation

    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR in create_donation: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_donations(
    status: str = None,
    authorization: str = Header(...),
):
    decoded = _require_auth(authorization)
    db = get_db()

    query = db.collection("donations")
    if status:
        query = query.where("status", "==", status)

    docs = query.stream()
    return [d.to_dict() for d in docs]


@router.get("/mine")
async def my_donations(authorization: str = Header(...)):
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()

    docs = db.collection("donations").where("donor_uid", "==", uid).stream()
    return [d.to_dict() for d in docs]


@router.get("/{donation_id}")
async def get_donation(donation_id: str, authorization: str = Header(...)):
    _require_auth(authorization)
    db = get_db()
    doc = db.collection("donations").document(donation_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Donation not found")
    return doc.to_dict()


@router.patch("/{donation_id}")
async def update_donation(
    donation_id: str,
    payload: DonationUpdate,
    authorization: str = Header(...),
):
    decoded = _require_auth(authorization)
    uid = decoded["uid"]
    db = get_db()

    doc_ref = db.collection("donations").document(donation_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Donation not found")

    updates = {
        "status": payload.status,
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }
    if payload.volunteer_id:
        updates["volunteer_uid"] = payload.volunteer_id
    if payload.ngo_id:
        updates["ngo_uid"] = payload.ngo_id

    doc_ref.update(updates)

    # Award points on key status transitions
    if payload.status == DonationStatus.picked_up and payload.volunteer_id:
        add_points(db, payload.volunteer_id, 15, "Pickup completed")
    if payload.status == DonationStatus.delivered:
        add_points(db, uid, 5, "Delivery confirmed")
        if payload.volunteer_id:
            add_points(db, payload.volunteer_id, 25, "Delivery completed")

    return {"message": "Donation updated", "status": payload.status}
