from datetime import datetime
from datetime import datetime
from fastapi import APIRouter
import httpx

router = APIRouter(prefix="/api/weather", tags=["Weather"])

@router.get("")
async def get_weather():
    latitude = 23.7271
    longitude = 92.7176

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,showers",
        "hourly": "precipitation,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm",
        "past_days": 1,
        "forecast_days": 2,
        "timezone": "Asia/Kolkata",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        r.raise_for_status()
        data = r.json()

    current = data["current"]
    hourly = data["hourly"]
    i = min(range(len(hourly["time"])), key=lambda j: abs(datetime.fromisoformat(hourly["time"][j]) - datetime.fromisoformat(current["time"])))

    rainfall_24h = sum(x or 0 for x in hourly["precipitation"][max(0, i-24):i+1])
    soil = hourly["soil_moisture_0_to_7cm"][i]

    if rainfall_24h >= 100:
        risk = "CRITICAL"
    elif rainfall_24h >= 50:
        risk = "HIGH"
    elif rainfall_24h >= 20:
        risk = "MODERATE"
    else:
        risk = "LOW"

    return {
        "source": "Open-Meteo",
        "source_type": "LIVE_WEATHER_API",
        "location": "Aizawl, Mizoram",
        "temperature_c": current.get("temperature_2m"),
        "humidity_percent": current.get("relative_humidity_2m"),
        "rainfall_24h_mm": round(rainfall_24h, 2),
        "current_precipitation_mm": current.get("precipitation"),
        "soil_moisture_percent": round(soil * 100, 1) if soil is not None else None,
        "risk": risk,
        "timestamp": current.get("time"),
    }
