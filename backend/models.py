from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    restaurant = "restaurant"
    college = "college"
    bakery = "bakery"
    ngo = "ngo"
    volunteer = "volunteer"
    admin = "admin"


class DonationStatus(str, Enum):
    created = "created"
    pending_match = "pending_match"
    accepted = "accepted"
    volunteer_assigned = "volunteer_assigned"
    picked_up = "picked_up"
    delivered = "delivered"
    completed = "completed"
    expired = "expired"


class RescuePriority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class OnboardRequest(BaseModel):
    uid: str
    role: UserRole
    name: str
    organization: str
    phone: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class DonationCreate(BaseModel):
    food_type: str
    quantity_kg: float
    is_vegetarian: bool
    prepared_at: str   # ISO timestamp string
    expires_at: str    # ISO timestamp string
    address: str
    lat: float
    lng: float
    is_packed: bool = False
    notes: Optional[str] = None


class DonationUpdate(BaseModel):
    status: DonationStatus
    volunteer_id: Optional[str] = None
    ngo_id: Optional[str] = None


class AIPredictRequest(BaseModel):
    day_of_week: int    # 0=Mon ... 6=Sun
    hour_of_day: int    # 0-23
    avg_past_customers: float
    special_event: bool = False


class AIPredictResponse(BaseModel):
    expected_customers: int
    suggested_quantity_kg: float
    surplus_risk_prediction: str  # "high", "medium", "low"
    recommended_preparation_kg: float
    tip: str
