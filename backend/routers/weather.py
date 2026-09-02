from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
import httpx

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("")
async def get_weather(
    latitude: float | None = Query(None),
    longitude: float | None = Query(None),
    location: str | None = Query(None),
):
    # --------------------------------------------------
    # 1. If a city/location name is provided,
    #    convert it to latitude/longitude using
    #    Open-Meteo Geocoding API.
    # --------------------------------------------------
    if location:
        async with httpx.AsyncClient(timeout=15) as client:
            geo_response = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={
                    "name": location,
                    "count": 1,
                    "language": "en",
                    "format": "json",
                },
            )

            geo_response.raise_for_status()
            geo_data = geo_response.json()

        results = geo_data.get("results", [])

        if not results:
            raise HTTPException(
                status_code=404,
                detail=f"Location '{location}' not found.",
            )

        place = results[0]

        latitude = place["latitude"]
        longitude = place["longitude"]

        location_name = place.get("name", location)
        country = place.get("country", "")
        admin1 = place.get("admin1", "")

        if admin1 and country:
            display_location = f"{location_name}, {admin1}, {country}"
        elif country:
            display_location = f"{location_name}, {country}"
        else:
            display_location = location_name

    # --------------------------------------------------
    # 2. Otherwise use GPS coordinates.
    # --------------------------------------------------
    elif latitude is not None and longitude is not None:
        display_location = "Current Location"

    else:
        raise HTTPException(
            status_code=400,
            detail="Provide latitude/longitude or a location.",
        )

    # --------------------------------------------------
    # 3. Get live weather from Open-Meteo.
    # --------------------------------------------------
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "rain,"
            "showers"
        ),
        "hourly": (
            "precipitation,"
            "soil_moisture_0_to_7cm"
        ),
        "past_days": 1,
        "forecast_days": 2,
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params=params,
        )

        response.raise_for_status()
        data = response.json()

    current = data["current"]
    hourly = data["hourly"]

    current_time = datetime.fromisoformat(current["time"])

    i = min(
        range(len(hourly["time"])),
        key=lambda j: abs(
            datetime.fromisoformat(hourly["time"][j])
            - current_time
        ),
    )

    # Last 24 hours rainfall
    rainfall_24h = sum(
        x or 0
        for x in hourly["precipitation"][max(0, i - 24):i + 1]
    )

    soil = hourly["soil_moisture_0_to_7cm"][i]

    # --------------------------------------------------
    # 4. Calculate landslide weather risk.
    # --------------------------------------------------
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

        "location": display_location,

        "latitude": latitude,
        "longitude": longitude,

        "temperature_c": current.get("temperature_2m"),
        "humidity_percent": current.get("relative_humidity_2m"),

        "rainfall_24h_mm": round(rainfall_24h, 2),

        "current_precipitation_mm": current.get(
            "precipitation"
        ),

        "soil_moisture_percent": (
            round(soil * 100, 1)
            if soil is not None
            else None
        ),

        "risk": risk,

        "timestamp": current.get("time"),
    }
