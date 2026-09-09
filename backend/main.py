from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import Incident

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Secure Intelligent Wearable API"
)

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
