from datetime import datetime
from typing import Optional


def calculate_rescue_score(
    expires_at: str,
    quantity_kg: float,
    distance_km: Optional[float] = None,
    food_type: str = "other",
    prepared_at: Optional[str] = None
) -> dict:
    """
    Calculate a Rescue Priority Score for a donation.
    High    → urgent action needed (expiring soon, large batch, far from NGO)
    Medium  → moderate urgency
    Low     → plenty of time
    
    Returns dict with: priority, score (0-100), reason
    """
    score = 0
    reasons = []

    # ── Time factor (max 40 pts) ──────────────────────────────────────────────
    try:
        # Normalize ISO strings (handling 'Z' and extra precision)
        clean_ts = expires_at.replace("Z", "+00:00")
        if "." in clean_ts:
            base, ms_tz = clean_ts.split(".", 1)
            # Take only up to 6 digits of milliseconds to satisfy fromisoformat
            ms = ms_tz[:6]
            tz = ""
            if "+" in ms_tz:
                tz = "+" + ms_tz.split("+", 1)[1]
            elif "-" in ms_tz:
                tz = "-" + ms_tz.split("-", 1)[1]
            clean_ts = f"{base}.{ms.split('+', 1)[0].split('-', 1)[0]}{tz}"

        expire_dt = datetime.fromisoformat(clean_ts)
        now = datetime.now(expire_dt.tzinfo)
        hours_left = (expire_dt - now).total_seconds() / 3600
    except Exception as e:
        print(f"Date parsing error: {e} for {expires_at}")
        hours_left = 12  # assume moderate urgency on failure

    if hours_left <= 0:
        score += 40
        reasons.append("Already expired")
    elif hours_left <= 2:
        score += 35
        reasons.append("Expires in < 2 hours")
    elif hours_left <= 6:
        score += 30
        reasons.append("Expires in < 6 hours")
    elif hours_left <= 12:
        score += 20
        reasons.append("Expires in < 12 hours")
    elif hours_left <= 24:
        score += 15
        reasons.append("Expires tomorrow")
    elif hours_left <= 48:
        score += 5
        reasons.append("Expires in < 2 days")

    # ── Quantity factor (max 20 pts) ──────────────────────────────────────────
    if quantity_kg >= 50:
        score += 20
        reasons.append("Very large batch (50+ kg)")
    elif quantity_kg >= 20:
        score += 15
        reasons.append("Large batch (20+ kg)")
    elif quantity_kg >= 5:
        score += 8
        reasons.append("Moderate quantity (5+ kg)")
    else:
        score += 4

    # ── Distance factor (max 15 pts) ─────────────────────────────────────────
    if distance_km is not None:
        if distance_km <= 1:
            score += 15
        elif distance_km <= 3:
            score += 12
        elif distance_km <= 7:
            score += 8
        elif distance_km <= 15:
            score += 4

    # ── Food Type factor (max 15 pts) ─────────────────────────────────────────
    type_lower = food_type.lower()
    if "fresh" in type_lower or "cooked" in type_lower or "meal" in type_lower:
        score += 15
        reasons.append("Fresh cooked food (breaks down faster)")
    elif "produce" in type_lower or "veg" in type_lower:
        score += 10
        reasons.append("Fresh produce")
    else:
        score += 5
        reasons.append("Packed/Dry food (more stable)")

    # ── Time of day factor (max 10 pts) ───────────────────────────────────────
    if prepared_at:
        try:
            prep_dt = datetime.fromisoformat(prepared_at.replace("Z", "+00:00"))
            hour = prep_dt.hour
            # Late night urgency (after 9 PM or very early morning)
            if hour >= 21 or hour <= 4:
                score += 10
                reasons.append("Late-night urgency")
            else:
                score += 5
        except Exception:
            score += 5
    else:
        score += 5

    # ── Map to priority ───────────────────────────────────────────────────────
    if score >= 60:
        priority = "high"
    elif score >= 30:
        priority = "medium"
    else:
        priority = "low"

    return {
        "priority": priority,
        "score": min(score, 100),
        "reason": "; ".join(reasons) if reasons else "Sufficient time remaining",
    }
