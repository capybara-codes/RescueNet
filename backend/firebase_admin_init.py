import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

load_dotenv()

_db = None
_app = None

def initialize_firebase():
    global _db, _app
    if _app is not None:
        return _db

    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")

    try:
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            _app = firebase_admin.initialize_app(cred)
        else:
            # Fallback: use environment variable for project ID (limited features)
            project_id = os.getenv("FIREBASE_PROJECT_ID", "rescuenet-ai-demo")
            _app = firebase_admin.initialize_app(options={"projectId": project_id})
            print(f"WARNING: serviceAccountKey.json not found. Using project ID: {project_id}")
    except ValueError:
        # App already initialized
        _app = firebase_admin.get_app()

    _db = firestore.client()
    return _db

def get_db():
    return _db or initialize_firebase()

def verify_token(id_token: str):
    # Support Demo Mode bypass
    if id_token.startswith("demo-"):
        role = id_token.replace("demo-", "")
        return {
            "uid": f"demo_uid_{role}",
            "email": f"demo_{role}@example.com",
            "is_demo": True,
            "demo_role": role
        }

    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")
