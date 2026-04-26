from fastapi import APIRouter, HTTPException, Header
from firebase_admin_init import get_db, verify_token

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(authorization: str, db):
    token = authorization.replace("Bearer ", "")
    try:
        decoded = verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    uid = decoded["uid"]
    doc = db.collection("users").document(uid).get()
    if not doc.exists or doc.to_dict().get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return uid


@router.get("/overview")
async def admin_overview(authorization: str = Header(...)):
    db = get_db()
    _require_admin(authorization, db)

    users = [u.to_dict() for u in db.collection("users").stream()]
    donations = [d.to_dict() for d in db.collection("donations").stream()]

    role_counts = {}
    verified_count = 0
    for u in users:
        r = u.get("role", "unknown")
        role_counts[r] = role_counts.get(r, 0) + 1
        if u.get("verified"):
            verified_count += 1

    status_counts = {}
    pending_urgent = 0
    for d in donations:
        s = d.get("status", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1
        
        # Monitor pending urgent
        if s in ["created", "pending_match"] and d.get("priority") == "high":
            pending_urgent += 1

    return {
        "total_users": len(users),
        "verified_users": verified_count,
        "pending_verification": len(users) - verified_count,
        "role_breakdown": role_counts,
        "total_donations": len(donations),
        "donation_status_breakdown": status_counts,
        "pending_urgent_donations": pending_urgent,
    }


@router.get("/users")
async def admin_users(authorization: str = Header(...)):
    db = get_db()
    _require_admin(authorization, db)
    docs = db.collection("users").stream()
    return [d.to_dict() for d in docs]


@router.patch("/users/{uid}/verify")
async def admin_verify_user(uid: str, authorization: str = Header(...)):
    db = get_db()
    _require_admin(authorization, db)
    doc_ref = db.collection("users").document(uid)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    doc_ref.update({"verified": True})
    return {"message": f"User {uid} verified"}


@router.delete("/donations/{donation_id}")
async def admin_delete_donation(donation_id: str, authorization: str = Header(...)):
    db = get_db()
    _require_admin(authorization, db)
    doc_ref = db.collection("donations").document(donation_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Donation not found")
    doc_ref.delete()
    return {"message": "Donation deleted"}


@router.get("/donations")
async def admin_all_donations(authorization: str = Header(...)):
    db = get_db()
    _require_admin(authorization, db)
    docs = db.collection("donations").stream()
    return [d.to_dict() for d in docs]
