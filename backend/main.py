from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, Field

from database import Base, engine, SessionLocal
from models import Incident


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="Secure Intelligent Wearable API"
)


# CORS configuration for React/Vite frontend
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


# -----------------------------
# Request Models
# -----------------------------

class SOSRequest(BaseModel):
    source: str


class LocationRequest(BaseModel):
    # Simulated GPS coordinates with validation
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


# -----------------------------
# Database Dependency
# -----------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Root Endpoint
# -----------------------------

@app.get("/")
def root():
    return {
        "message": "Secure Intelligent Wearable API"
    }


# -----------------------------
# Get All Incidents
# -----------------------------

@app.get("/api/incidents")
def get_incidents(
    db: Session = Depends(get_db)
):
    incidents = db.query(Incident).all()

    return [
        {
            "id": incident.id,
            "incident_id": incident.incident_id,
            "type": incident.type,
            "status": incident.status,
            "source": incident.source,
            "created_at": incident.created_at,
            "latitude": incident.latitude,
            "longitude": incident.longitude
        }
        for incident in incidents
    ]


# -----------------------------
# Create SOS Incident
# -----------------------------

@app.post("/api/incidents/sos")
def create_sos(
    request: SOSRequest,
    db: Session = Depends(get_db)
):
    last_incident = (
        db.query(Incident)
        .order_by(Incident.id.desc())
        .first()
    )

    next_number = (
        last_incident.id + 1
        if last_incident
        else 1
    )

    incident_id = f"INC-{next_number:06d}"

    incident = Incident(
        incident_id=incident_id,
        type="SOS",
        status="ACTIVE",
        source=request.source,
        created_at=datetime.utcnow()
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    return {
        "success": True,
        "incident_id": incident.incident_id,
        "status": incident.status
    }


# -----------------------------
# Update Incident Location
# -----------------------------

@app.post("/api/incidents/{incident_id}/location")
def update_location(
    incident_id: str,
    request: LocationRequest,
    db: Session = Depends(get_db)
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.incident_id == incident_id
        )
        .first()
    )

    if not incident:
        return {
            "success": False,
            "message": "Incident not found"
        }

    # Store simulated GPS coordinates
    incident.latitude = request.latitude
    incident.longitude = request.longitude

    db.commit()
    db.refresh(incident)

    return {
        "success": True,
        "incident_id": incident.incident_id,
        "latitude": incident.latitude,
        "longitude": incident.longitude
    }