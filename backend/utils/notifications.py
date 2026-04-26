import firebase_admin
from firebase_admin import messaging
from typing import Optional, Dict

def send_notification(token: str, title: str, body: str, data: Optional[Dict[str, str]] = None):
    """
    Sends a push notification via Firebase Cloud Messaging.
    Fails gracefully if token is invalid or FCM is not fully configured,
    which allows easy testing for hackathons without breaking the app.
    
    To set this up for real devices:
    1. Ensure your front-end requests Notification permissions.
    2. Obtain the FCM token via `getToken()` from `firebase/messaging`.
    3. Save the token to the user document in Firestore.
    4. Call this function with the user's token.
    """
    if not token:
        print(f"[Mock Notification] No token provided. Title: '{title}' Body: '{body}'")
        return

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data if data else {},
            token=token,
        )
        response = messaging.send(message)
        print(f"Successfully sent FCM message: {response}")
    except Exception as e:
        print(f"Failed to send FCM message to token {token}. Error: {e}")
        # Not throwing an exception here so it doesn't break the main flow.

def notify_user(db, uid: str, title: str, body: str, data: Optional[Dict[str, str]] = None):
    """Helper method to fetch a user's token and send them a notification."""
    try:
        user_doc = db.collection("users").document(uid).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            token = user_data.get("fcm_token")
            # If no token is found, send_notification will just mock sprint it.
            send_notification(token, title, body, data)
        else:
            print(f"[Mock Notification] User {uid} not found.")
    except Exception as e:
        print(f"[Mock Notification] Error looking up user {uid}: {e}")
