from .risk_engine import calculate_risk


def analyze_incident(
    sos_status: bool,
    fall_detected: bool,
    acceleration: float,
    gyro: float,
) -> dict:
    """
    [SIMULATED] AI risk analysis interface.

    Delegates to the current rule-based risk engine so the backend
    does not depend directly on the implementation details of the
    risk model.
    """
    return calculate_risk(
        sos_status=sos_status,
        fall_detected=fall_detected,
        acceleration=acceleration,
        gyro=gyro,
    )
