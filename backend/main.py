from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from database import Base, engine, SessionLocal
from models import Incident

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Secure Intelligent Wearable API"
)


class SOSRequest(BaseModel):
    source: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "Secure Intelligent Wearable API"
    }


@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()

    return [
        {
            "id": incident.id,
            "incident_id": incident.incident_id,
            "type": incident.type,
            "status": incident.status,
            "source": incident.source,
            "created_at": incident.created_at
        }
        for incident in incidents
    ]


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

    if last_incident:
        next_number = last_incident.id + 1
    else:
        next_number = 1

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