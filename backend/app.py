from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin_init import initialize_firebase

# Initialize Firebase on startup
initialize_firebase()

from routers import auth, donations, ai, ngo, volunteer, impact, admin

app = FastAPI(
    title="RescueNet AI API",
    description="Smart food waste prevention & redistribution platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(donations.router)
app.include_router(ai.router)
app.include_router(ngo.router)
app.include_router(volunteer.router)
app.include_router(impact.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {
        "app": "RescueNet AI",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
