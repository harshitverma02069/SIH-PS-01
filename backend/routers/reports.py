from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

router = APIRouter(prefix="/api/reports", tags=["Reports"])

UPLOAD_DIR = Path("uploads/reports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
}

MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_FILES = 5


@router.post("")
async def create_report(
    incident_type: str = Form(...),
    severity: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    client_report_id: str = Form(...),
    files: list[UploadFile] | None = File(default=None),
):
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Invalid latitude")

    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid longitude")

    if severity.upper() not in {"LOW", "MODERATE", "HIGH", "CRITICAL"}:
        raise HTTPException(status_code=400, detail="Invalid severity")

    if not description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    files = files or []

    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_FILES} files allowed",
        )

    saved_files = []

    for uploaded in files:
        if uploaded.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {uploaded.content_type}",
            )

        content = await uploaded.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"{uploaded.filename} exceeds 10 MB limit",
            )

        extension = Path(uploaded.filename or "").suffix.lower()
        filename = f"{uuid4().hex}{extension}"
        destination = UPLOAD_DIR / filename
        destination.write_bytes(content)

        saved_files.append({
            "filename": filename,
            "original_name": uploaded.filename,
            "content_type": uploaded.content_type,
            "size": len(content),
        })

    report_id = str(uuid4())

    return {
        "success": True,
        "report_id": report_id,
        "client_report_id": client_report_id,
        "incident_type": incident_type,
        "severity": severity.upper(),
        "description": description,
        "latitude": latitude,
        "longitude": longitude,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "media_count": len(saved_files),
        "media": saved_files,
        "status": "RECEIVED",
        "message": "Incident report received successfully",
    }
