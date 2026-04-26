from fastapi import APIRouter, HTTPException, Header
from firebase_admin_init import get_db, verify_token
from models import OnboardRequest
from utils.rewards import get_initial_rewards

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/onboard")
async def onboard_user(payload: OnboardRequest, authorization: str = Header(...)):
    """Called after signup to save user profile with chosen role."""
    token = authorization.replace("Bearer ", "")
    try:
        decoded = verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    uid = decoded["uid"]
    db = get_db()
    user_doc = {
        "uid": uid,
        "email": decoded.get("email", ""),
        "role": payload.role,
        "name": payload.name,
        "organization": payload.organization,
        "phone": payload.phone,
        "address": payload.address,
        "lat": payload.lat,
        "lng": payload.lng,
        "rewards": get_initial_rewards(),
        "verified": payload.role not in ["ngo", "volunteer"],  # NGO/vol need admin verify
        "created_at": __import__("datetime").datetime.utcnow().isoformat(),
    }
    db.collection("users").document(uid).set(user_doc)
    return {"message": "Onboarding complete", "role": payload.role}


@router.get("/me")
async def get_me(authorization: str = Header(...)):
    """Return current user profile from Firestore."""
    token = authorization.replace("Bearer ", "")
    try:
        decoded = verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    uid = decoded["uid"]
    db = get_db()

    # Handle mock profile for demo users
    if decoded.get("is_demo"):
        role = decoded.get("demo_role", "restaurant")
        return {
            "uid": uid,
            "email": decoded.get("email"),
            "role": role,
            "name": f"Demo {role.capitalize()}",
            "organization": f"Example {role.capitalize()} Ltd",
            "phone": "999-000-0000",
            "address": "123 Demo St, Smart City",
            "rewards": {
                "points": 450 if role == "restaurant" else 120,
                "badges": ["first_rescue", "green_starter"] if role == "restaurant" else [],
                "streak": 5,
                "last_activity": __import__("datetime").datetime.utcnow().isoformat()
            },
            "verified": True,
            "is_demo": True
        }

    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")
    return doc.to_dict()


@router.get("/users")
async def list_users(authorization: str = Header(...)):
    """Admin only — list all users."""
    token = authorization.replace("Bearer ", "")
    try:
        decoded = verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    uid = decoded["uid"]
    db = get_db()
    caller = db.collection("users").document(uid).get()
    if not caller.exists or caller.to_dict().get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    docs = db.collection("users").stream()
    return [d.to_dict() for d in docs]


@router.patch("/users/{target_uid}/verify")
async def verify_user(target_uid: str, authorization: str = Header(...)):
    """Admin — verify an NGO or volunteer account."""
    token = authorization.replace("Bearer ", "")
    try:
        decoded = verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    uid = decoded["uid"]
    db = get_db()
    caller = db.collection("users").document(uid).get()
    if not caller.exists or caller.to_dict().get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    db.collection("users").document(target_uid).update({"verified": True})
    return {"message": f"User {target_uid} verified"}
