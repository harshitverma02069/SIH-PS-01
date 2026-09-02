from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
import httpx
import time

router = APIRouter(prefix="/api/weather", tags=["Weather"])

CACHE = {}
CACHE_SECONDS = 60


def get_cache(key):
    item = CACHE.get(key)
    if item and time.time() - item["time"] < CACHE_SECONDS:
        return item["data"]
    return None


def set_cache(key, data):
    CACHE[key] = {
        "time": time.time(),
        "data": data,
    }


def calculate_weather(data, latitude, longitude, location):
    current = data["current"]
    hourly = data["hourly"]

    current_time = datetime.fromisoformat(current["time"])

    i = min(
        range(len(hourly["time"])),
        key=lambda j: abs(
            datetime.fromisoformat(hourly["time"][j]) - current_time
        ),
    )

    rainfall_24h = sum(
        x or 0
        for x in hourly["precipitation"][max(0, i - 24):i + 1]
    )

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
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "temperature_c": current.get("temperature_2m"),
        "humidity_percent": current.get("relative_humidity_2m"),
        "rainfall_24h_mm": round(rainfall_24h, 2),
        "current_precipitation_mm": current.get("precipitation"),
        "soil_moisture_percent": (
            round(soil * 100, 1)
            if soil is not None
            else None
        ),
        "risk": risk,
        "timestamp": current.get("time"),
    }


@router.get("")
async def get_weather(
    latitude: float | None = Query(None),
    longitude: float | None = Query(None),
    location: str | None = Query(None),
):
    if latitude is None or longitude is None:
        if not location:
            raise HTTPException(
                status_code=400,
                detail="Provide latitude/longitude or location"
            )

        geocode_key = f"geo:{location.strip().lower()}"
        cached_geo = get_cache(geocode_key)

        if cached_geo:
            latitude = cached_geo["latitude"]
            longitude = cached_geo["longitude"]
            location_name = cached_geo["location"]
        else:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={
                        "name": location,
                        "count": 1,
                        "language": "en",
                        "format": "json",
                    },
                )
                response.raise_for_status()
                geo_data = response.json()

            results = geo_data.get("results", [])

            if not results:
                raise HTTPException(
                    status_code=404,
                    detail=f"Location not found: {location}"
                )

            result = results[0]

            latitude = result["latitude"]
            longitude = result["longitude"]

            parts = [
                result.get("name"),
                result.get("admin1"),
                result.get("country"),
            ]

            location_name = ", ".join(
                str(x) for x in parts if x
            )

            set_cache(
                geocode_key,
                {
                    "latitude": latitude,
                    "longitude": longitude,
                    "location": location_name,
                },
            )

    weather_key = f"weather:{round(latitude, 3)}:{round(longitude, 3)}"

    cached_weather = get_cache(weather_key)

    if cached_weather:
        return cached_weather

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,showers",
        "hourly": "precipitation,soil_moisture_0_to_7cm",
        "past_days": 1,
        "forecast_days": 2,
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params=params,
            )
            response.raise_for_status()
            data = response.json()

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            cached_weather = get_cache(weather_key)
            if cached_weather:
                return cached_weather

            raise HTTPException(
                status_code=503,
                detail="Weather provider is temporarily rate-limited. Please try again shortly."
            )

        raise HTTPException(
            status_code=502,
            detail="Weather provider request failed."
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Unable to reach weather provider."
        )

    if location is None:
        location_name = "Current Location"
    else:
        location_name = location

    result = calculate_weather(
        data,
        latitude,
        longitude,
        location_name,
    )

    set_cache(weather_key, result)

    return result
