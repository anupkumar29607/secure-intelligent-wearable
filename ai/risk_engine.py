"""
[SIMULATED] Rule-based risk engine for the Security Watch prototype.

This is NOT an ML model. It is designed to provide a simple risk
decision now and can later be replaced by an ML inference layer.
"""


def calculate_risk(
    sos_status: bool,
    fall_detected: bool,
    acceleration: float,
    gyro: float,
) -> dict:
    """
    Calculate a simulated risk level from SOS and fall status.

    acceleration and gyro are accepted as simulated wearable sensor
    inputs so the function interface is ready for future expansion.
    They are intentionally not thresholded by this initial rule engine.
    """

    if sos_status and fall_detected:
        return {
            "risk_level": "HIGH",
            "reason": "SOS and fall event detected",
        }

    if sos_status:
        return {
            "risk_level": "HIGH",
            "reason": "SOS activated",
        }

    if fall_detected:
        return {
            "risk_level": "MEDIUM",
            "reason": "Fall detected",
        }

    return {
        "risk_level": "LOW",
        "reason": "Normal motion",
    }


if __name__ == "__main__":
    test_cases = [
        {
            "name": "SOS + fall",
            "sos_status": True,
            "fall_detected": True,
            "acceleration": 12.5,
            "gyro": 4.2,
            "expected": "HIGH",
        },
        {
            "name": "SOS only",
            "sos_status": True,
            "fall_detected": False,
            "acceleration": 1.2,
            "gyro": 0.4,
            "expected": "HIGH",
        },
        {
            "name": "Fall only",
            "sos_status": False,
            "fall_detected": True,
            "acceleration": 10.2,
            "gyro": 3.5,
            "expected": "MEDIUM",
        },
        {
            "name": "Normal motion",
            "sos_status": False,
            "fall_detected": False,
            "acceleration": 1.0,
            "gyro": 0.2,
            "expected": "LOW",
        },
    ]

    all_passed = True

    for case in test_cases:
        result = calculate_risk(
            sos_status=case["sos_status"],
            fall_detected=case["fall_detected"],
            acceleration=case["acceleration"],
            gyro=case["gyro"],
        )

        passed = result["risk_level"] == case["expected"]
        all_passed = all_passed and passed

        print(f'{case["name"]}: {"PASS" if passed else "FAIL"}')
        print(f"  Result: {result}")

    print()
    print("All tests passed." if all_passed else "Some tests failed.")
