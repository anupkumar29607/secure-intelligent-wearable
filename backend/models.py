from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
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

    # Simulated GPS
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Simulated motion sensor data
    acceleration = Column(Float, nullable=True)
    gyro = Column(Float, nullable=True)
    fall_detected = Column(Boolean, nullable=True)