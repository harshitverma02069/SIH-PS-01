def calculate_risk(rainfall, soil_moisture, slope, historical_events):
    score = (
        min(rainfall / 250, 1) * 35 +
        (soil_moisture / 100) * 25 +
        min(slope / 60, 1) * 25 +
        min(historical_events / 10, 1) * 15
    )

    score = round(min(score, 100), 1)

    if score >= 75:
        severity = "CRITICAL"
    elif score >= 50:
        severity = "HIGH"
    elif score >= 25:
        severity = "MODERATE"
    else:
        severity = "LOW"

    return {
        "risk_score": score,
        "severity": severity
    }
