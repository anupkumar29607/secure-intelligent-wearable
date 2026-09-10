from sqlalchemy import Column, Integer, String, DateTime, Float
from datetime import datetime
from database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    incident_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    source = Column(String, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Simulated GPS location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)