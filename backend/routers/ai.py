from fastapi import APIRouter
from models import AIPredictRequest, AIPredictResponse

router = APIRouter(prefix="/ai", tags=["ai"])

# Day-of-week multipliers (Mon=0 .. Sun=6)
_DAY_MULT = {0: 1.0, 1: 0.95, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.35, 6: 1.3}

# Hour-of-day multipliers for peak meal times
_HOUR_MULT = {
    6: 0.6, 7: 0.8, 8: 1.1, 9: 0.9, 10: 0.8,
    11: 1.2, 12: 1.5, 13: 1.3, 14: 0.8, 15: 0.7,
    16: 0.7, 17: 0.9, 18: 1.3, 19: 1.4, 20: 1.1,
    21: 0.8, 22: 0.5, 23: 0.3,
}


@router.post("/predict", response_model=AIPredictResponse)
async def predict_demand(payload: AIPredictRequest) -> AIPredictResponse:
    """
    Simple rule-based AI demand prediction.
    Returns expected customers, surplus risk, and recommended prep quantity.
    """
    day_mult = _DAY_MULT.get(payload.day_of_week % 7, 1.0)
    hour_mult = _HOUR_MULT.get(payload.hour_of_day % 24, 0.5)
    event_boost = 1.25 if payload.special_event else 1.0

    expected = int(payload.avg_past_customers * day_mult * hour_mult * event_boost)

    # Assume 0.5 kg of food per expected customer
    suggested_kg = round(expected * 0.5, 1)

    # Overproduction warning: if preparing >25% more than expected
    overproduction = payload.avg_past_customers * 1.25 > expected * 1.5

    if overproduction:
        level = "high"
        tip = (
            "Consider reducing prep by ~20%. "
            "Peak traffic today looks lower than your usual average."
        )
    elif hour_mult >= 1.3 or event_boost > 1:
        level = "medium"
        tip = "High demand expected — ensure you have enough stock!"
    else:
        level = "low"
        tip = "Demand looks normal. Prepare your usual quantity."

    return AIPredictResponse(
        expected_customers=expected,
        suggested_quantity_kg=suggested_kg,
        surplus_risk_prediction=level,
        recommended_preparation_kg=suggested_kg,
        tip=tip,
    )
