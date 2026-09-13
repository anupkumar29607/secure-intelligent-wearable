import sys
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import Incident

# Make the repository-level ai/ package available to the backend worktree.
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ai.risk_service import analyze_incident

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Secure Intelligent Wearable API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SOSRequest(BaseModel):
    source: str = Field(..., min_length=1, max_length=100)


class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class MotionRequest(BaseModel):
    acceleration: float = Field(..., ge=0, le=100)
    gyro: float = Field(..., ge=0, le=1000)
    fall_detected: bool


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Secure Intelligent Wearable API"}


@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.id.asc()).all()

    return [
        {
            "id": incident.id,
            "incident_id": incident.incident_id,
            "type": incident.type,
            "status": incident.status,
            "source": incident.source,
            "created_at": incident.created_at,
            "latitude": incident.latitude,
            "longitude": incident.longitude,
            "acceleration": incident.acceleration,
            "gyro": incident.gyro,
            "fall_detected": incident.fall_detected,
        }
        for incident in incidents
    ]


@app.post("/api/incidents/sos")
def create_sos(request: SOSRequest, db: Session = Depends(get_db)):
    last_incident = (
        db.query(Incident)
        .order_by(Incident.id.desc())
        .first()
    )

    next_number = last_incident.id + 1 if last_incident else 1
    incident_id = f"INC-{next_number:06d}"

    incident = Incident(
        incident_id=incident_id,
        type="SOS",
        status="ACTIVE",
        source=request.source,
        created_at=datetime.utcnow(),
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    risk = analyze_incident(
        sos_status=True,
        fall_detected=False,
        acceleration=0.0,
        gyro=0.0,
    )

    return {
        "success": True,
        "incident_id": incident.incident_id,
        "status": incident.status,
        "risk_level": risk["risk_level"],
        "reason": risk["reason"],
    }


@app.post("/api/incidents/{incident_id}/location")
def update_location(
    incident_id: str,
    request: LocationRequest,
    db: Session = Depends(get_db),
):
    incident = (
        db.query(Incident)
        .filter(Incident.incident_id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.latitude = request.latitude
    incident.longitude = request.longitude

    db.commit()
    db.refresh(incident)

    return {
        "success": True,
        "incident_id": incident.incident_id,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
    }


@app.post("/api/incidents/{incident_id}/motion")
def update_motion(
    incident_id: str,
    request: MotionRequest,
    db: Session = Depends(get_db),
):
    incident = (
        db.query(Incident)
        .filter(Incident.incident_id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.acceleration = request.acceleration
    incident.gyro = request.gyro
    incident.fall_detected = request.fall_detected

    db.commit()
    db.refresh(incident)

    sos_status = incident.type == "SOS" and incident.status == "ACTIVE"

    risk = analyze_incident(
        sos_status=sos_status,
        fall_detected=request.fall_detected,
        acceleration=request.acceleration,
        gyro=request.gyro,
    )

    return {
        "success": True,
        "incident_id": incident.incident_id,
        "acceleration": incident.acceleration,
        "gyro": incident.gyro,
        "fall_detected": incident.fall_detected,
        "risk_level": risk["risk_level"],
        "reason": risk["reason"],
    }


@app.post("/api/incidents/{incident_id}/risk")
def analyze_existing_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    incident = (
        db.query(Incident)
        .filter(Incident.incident_id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    risk = analyze_incident(
        sos_status=incident.type == "SOS" and incident.status == "ACTIVE",
        fall_detected=bool(incident.fall_detected),
        acceleration=incident.acceleration or 0.0,
        gyro=incident.gyro or 0.0,
    )

    return {
        "success": True,
        "incident_id": incident.incident_id,
        "risk_level": risk["risk_level"],
        "reason": risk["reason"],
        "inputs": {
            "sos_status": incident.type == "SOS" and incident.status == "ACTIVE",
            "fall_detected": bool(incident.fall_detected),
            "acceleration": incident.acceleration or 0.0,
            "gyro": incident.gyro or 0.0,
        },
    }
