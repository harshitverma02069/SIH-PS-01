from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.reports import router as reports_router
from datetime import datetime
from routers.weather import router as weather_router

app = FastAPI(
    title="NER Landslide Early Warning API",
    description="AI-powered landslide monitoring and early warning backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


RISK_ZONES = [
    {
        "id": 1,
        "name": "Aizawl North",
        "state": "Mizoram",
        "score": 87,
        "level": "CRITICAL",
        "rainfall": 182,
        "soil_moisture": 81,
        "slope": 43,
    },
    {
        "id": 2,
        "name": "Gangtok East",
        "state": "Sikkim",
        "score": 74,
        "level": "HIGH",
        "rainfall": 146,
        "soil_moisture": 72,
        "slope": 38,
    },
    {
        "id": 3,
        "name": "Shillong Hills",
        "state": "Meghalaya",
        "score": 63,
        "level": "HIGH",
        "rainfall": 128,
        "soil_moisture": 68,
        "slope": 31,
    },
    {
        "id": 4,
        "name": "Kohima West",
        "state": "Nagaland",
        "score": 48,
        "level": "MODERATE",
        "rainfall": 94,
        "soil_moisture": 54,
        "slope": 27,
    },
    {
        "id": 5,
        "name": "Itanagar South",
        "state": "Arunachal Pradesh",
        "score": 22,
        "level": "LOW",
        "rainfall": 61,
        "soil_moisture": 38,
        "slope": 19,
    },
]


@app.get("/")
def root():
    return {
        "message": "NER Landslide Monitoring API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/health")
def api_health():
    return {
        "status": "healthy",
        "service": "NER Landslide Early Warning API",
    }


@app.get("/api/risk-zones")
async def get_risk_zones():
    import httpx

    latitude = 23.7271
    longitude = 92.7176

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "precipitation",
        "hourly": "precipitation,soil_moisture_0_to_7cm",
        "past_days": 1,
        "forecast_days": 1,
        "timezone": "Asia/Kolkata",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params=params
        )
        response.raise_for_status()
        weather = response.json()

    hourly = weather["hourly"]
    current_time = weather["current"]["time"]

    i = min(
        range(len(hourly["time"])),
        key=lambda j: abs(
            __import__("datetime").datetime.fromisoformat(hourly["time"][j])
            - __import__("datetime").datetime.fromisoformat(current_time)
        )
    )

    rainfall_24h = sum(
        x or 0 for x in hourly["precipitation"][max(0, i-24):i+1]
    )

    soil = hourly["soil_moisture_0_to_7cm"][i]
    soil_percent = round(soil * 100, 1) if soil is not None else None

    zones = []

    for zone in RISK_ZONES:
        z = zone.copy()

        if zone["id"] == 1:
            z["rainfall"] = round(rainfall_24h, 1)
            z["soil_moisture"] = soil_percent

            score = min(
                100,
                round(
                    rainfall_24h * 0.45
                    + (soil_percent or 0) * 0.30
                    + zone["slope"] * 0.25
                )
            )

            z["score"] = score
            z["level"] = (
                "CRITICAL" if score >= 80
                else "HIGH" if score >= 60
                else "MODERATE" if score >= 40
                else "LOW"
            )

        zones.append(z)

    return {
        "count": len(zones),
        "zones": zones,
        "source": "Open-Meteo",
        "source_type": "LIVE_WEATHER_API",
        "weather_timestamp": current_time,
    }


@app.get("/api/risk-zones/{zone_id}")
def get_risk_zone(zone_id: int):
    for zone in RISK_ZONES:
        if zone["id"] == zone_id:
            return zone

    return {
        "error": "Risk zone not found"
    }


@app.get("/api/alerts")
async def get_alerts():
    zones_response = await get_risk_zones()
    zones = zones_response["zones"]

    alerts = []

    for zone in zones:
        if zone["level"] in ("CRITICAL", "HIGH"):
            alerts.append({
                "id": zone["id"],
                "severity": zone["level"],
                "location": zone["name"],
                "risk_score": zone["score"],
                "message": f"Live weather-linked risk detected in {zone['name']}.",
                "status": "ACTIVE",
            })

    return {
        "count": len(alerts),
        "alerts": alerts,
        "source": zones_response["source"],
        "source_type": zones_response["source_type"],
        "timestamp": zones_response["weather_timestamp"],
    }


@app.get("/api/roads/status")
def get_roads():
    return {
        "roads": [
            {
                "name": "NH-10",
                "route": "Gangtok → Siliguri",
                "status": "BLOCKED",
            },
            {
                "name": "NH-6",
                "route": "Shillong Region",
                "status": "AT RISK",
            },
            {
                "name": "NH-37",
                "route": "Assam Corridor",
                "status": "OPERATIONAL",
            },
            {
                "name": "NH-15",
                "route": "Arunachal Route",
                "status": "AT RISK",
            },
        ]
    }


app.include_router(reports_router)
app.include_router(weather_router)
