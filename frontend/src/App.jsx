import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const SIMULATED_LATITUDE = 28.6139;
const SIMULATED_LONGITUDE = 77.2090;

function App() {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [motionLoading, setMotionLoading] = useState(false);
  const [error, setError] = useState("");

  // Load latest incident
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/incidents`
        );

        if (!response.ok) {
          throw new Error("Failed to load incidents");
        }

        const data = await response.json();

        if (data.length > 0) {
          const latest = data[data.length - 1];

          setIncident(latest);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadIncidents();
  }, []);

  // Create SOS + GPS automatically
  const activateSOS = async () => {
    setLoading(true);
    setError("");

    try {
      // Create incident
      const sosResponse = await fetch(
        `${API_URL}/api/incidents/sos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: "DIGITAL_SIMULATOR",
          }),
        }
      );

      if (!sosResponse.ok) {
        throw new Error("Failed to activate SOS");
      }

      const sosData = await sosResponse.json();

      // Attach simulated GPS
      const locationResponse = await fetch(
        `${API_URL}/api/incidents/${sosData.incident_id}/location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: SIMULATED_LATITUDE,
            longitude: SIMULATED_LONGITUDE,
          }),
        }
      );

      if (!locationResponse.ok) {
        throw new Error("Failed to update location");
      }

      const locationData = await locationResponse.json();

      setIncident({
        ...sosData,
        type: "SOS",
        source: "DIGITAL_SIMULATOR",
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        acceleration: null,
        gyro: null,
        fall_detected: false,
      });

    } catch (err) {
      console.error(err);

      setError(
        "Unable to complete emergency request. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Simulate normal movement
  const simulateNormalMotion = async () => {
    if (!incident) {
      setError("Activate SOS first.");
      return;
    }

    setMotionLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${incident.incident_id}/motion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acceleration: 1.1,
            gyro: 0.8,
            fall_detected: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send motion data");
      }

      const data = await response.json();

      setIncident((previous) => ({
        ...previous,
        acceleration: data.acceleration,
        gyro: data.gyro,
        fall_detected: data.fall_detected,
        risk_level: data.risk_level,
        risk_reason: data.reason,
      }));

    } catch (err) {
      console.error(err);
      setError("Unable to send motion data.");
    } finally {
      setMotionLoading(false);
    }
  };

  // Simulate fall detection
  const simulateFall = async () => {
    if (!incident) {
      setError("Activate SOS first.");
      return;
    }

    setMotionLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${incident.incident_id}/motion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acceleration: 8.7,
            gyro: 4.2,
            fall_detected: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send fall data");
      }

      const data = await response.json();

      setIncident((previous) => ({
        ...previous,
        acceleration: data.acceleration,
        gyro: data.gyro,
        fall_detected: data.fall_detected,
        risk_level: data.risk_level,
        risk_reason: data.reason,
      }));

    } catch (err) {
      console.error(err);
      setError("Unable to send fall data.");
    } finally {
      setMotionLoading(false);
    }
  };

  const hasLocation =
    incident?.latitude !== null &&
    incident?.latitude !== undefined &&
    incident?.longitude !== null &&
    incident?.longitude !== undefined;

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div>
          <h1>Secure Intelligent Wearable</h1>
          <p>
            Personal Safety & Emergency Response System
          </p>
        </div>

        <div className="device-status">
          <span className="status-dot"></span>
          Device Online
        </div>
      </header>

      <main className="dashboard">

        {/* Hero */}
        <section className="hero-card">
          <div>
            <span className="badge">
              SIH 2026 • DIGITAL PROTOTYPE
            </span>

            <h2>
              Emergency Response Dashboard
            </h2>

            <p>
              Monitor wearable status, emergency incidents,
              risk analysis, location, motion sensors and
              evidence integrity.
            </p>
          </div>

          <button
            className="sos-button"
            onClick={activateSOS}
            disabled={loading}
          >
            {loading
              ? "ACTIVATING..."
              : "🚨 ACTIVATE SOS"}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* SOS Alert */}
        {incident && (
          <section className="incident-alert">
            <div>
              <strong>
                🚨 SOS ACTIVATED
              </strong>

              <p>
                Incident ID:{" "}
                <b>{incident.incident_id}</b>
              </p>
            </div>

            <span className="active-status">
              {incident.status}
            </span>
          </section>
        )}

        {/* Statistics */}
        <section className="stats-grid">

          <div className="card">
            <span>Device Status</span>
            <strong>ONLINE</strong>
            <small>[SIMULATED]</small>
          </div>

          <div className="card">
            <span>Current Risk</span>

            <strong>
              {incident?.fall_detected
                ? "HIGH"
                : incident
                  ? "HIGH"
                  : "LOW"}
            </strong>

            <small>[SIMULATED]</small>
          </div>

          <div className="card">
            <span>Location</span>

            <strong>
              {hasLocation
                ? `${incident.latitude}, ${incident.longitude}`
                : "AVAILABLE"}
            </strong>

            <small>[SIMULATED GPS]</small>
          </div>

          <div className="card">
            <span>Evidence</span>
            <strong>READY</strong>
            <small>[SIMULATED]</small>
          </div>

        </section>

        {/* Sensor Controls */}
        <section className="panel sensor-panel">

          <h3>
            Wearable Sensor Simulation
          </h3>

          <p>
            Simulate sensor events for testing the
            emergency detection pipeline.
          </p>

          <div className="sensor-buttons">

            <button
              className="sensor-button"
              onClick={simulateNormalMotion}
              disabled={
                motionLoading || !incident
              }
            >
              {motionLoading
                ? "PROCESSING..."
                : "📡 NORMAL MOTION"}
            </button>

            <button
              className="fall-button"
              onClick={simulateFall}
              disabled={
                motionLoading || !incident
              }
            >
              {motionLoading
                ? "PROCESSING..."
                : "⚠️ SIMULATE FALL"}
            </button>

          </div>

        </section>

        {/* Sensor Data */}
        <section className="stats-grid">

          <div className="card">
            <span>Acceleration</span>

            <strong>
              {incident?.acceleration ??
                "N/A"}
            </strong>

            <small>
              m/s² [SIMULATED]
            </small>
          </div>

          <div className="card">
            <span>Gyroscope</span>

            <strong>
              {incident?.gyro ??
                "N/A"}
            </strong>

            <small>
              deg/s [SIMULATED]
            </small>
          </div>

          <div className="card">
            <span>Fall Detection</span>

            <strong>
              {incident?.fall_detected
                ? "DETECTED"
                : "NORMAL"}
            </strong>

            <small>[SIMULATED]</small>
          </div>

          <div className="card">
            <span>Risk Reason</span>

            <strong>
              {incident?.risk_reason ??
                "Awaiting sensor event"}
            </strong>

            <small>[SIMULATED]</small>
          </div>

        </section>

        {/* Main Content */}
        <section className="content-grid">

          {/* Latest Incident */}
          <div className="panel">

            <h3>
              Latest Incident
            </h3>

            {incident ? (

              <div className="incident-details">

                <div className="empty-icon">
                  🚨
                </div>

                <h4>
                  Active Emergency
                </h4>

                <p>
                  <b>Incident:</b>{" "}
                  {incident.incident_id}
                </p>

                <p>
                  <b>Type:</b>{" "}
                  {incident.type}
                </p>

                <p>
                  <b>Status:</b>{" "}
                  {incident.status}
                </p>

                <p>
                  <b>Source:</b>{" "}
                  {incident.source}
                </p>

                <p>
                  <b>Latitude:</b>{" "}
                  {incident.latitude ??
                    "Not available"}
                </p>

                <p>
                  <b>Longitude:</b>{" "}
                  {incident.longitude ??
                    "Not available"}
                </p>

                <p>
                  <b>Acceleration:</b>{" "}
                  {incident.acceleration ??
                    "Not available"}
                </p>

                <p>
                  <b>Gyroscope:</b>{" "}
                  {incident.gyro ??
                    "Not available"}
                </p>

                <p>
                  <b>Fall:</b>{" "}
                  {incident.fall_detected
                    ? "DETECTED"
                    : "Not detected"}
                </p>

              </div>

            ) : (

              <div className="empty-state">

                <div className="empty-icon">
                  🛡️
                </div>

                <h4>
                  No Active Incidents
                </h4>

                <p>
                  Emergency incidents created by
                  the wearable will appear here.
                </p>

              </div>

            )}

          </div>

          {/* Pipeline */}
          <div className="panel">

            <h3>
              System Pipeline
            </h3>

            <div className="pipeline">

              <div>
                Wearable Simulator
              </div>

              <span>↓</span>

              <div>
                SOS Event
              </div>

              <span>↓</span>

              <div>
                GPS Location
              </div>

              <span>↓</span>

              <div>
                Motion Sensors
              </div>

              <span>↓</span>

              <div>
                Fall Detection
              </div>

              <span>↓</span>

              <div>
                Risk Analysis
              </div>

              <span>↓</span>

              <div>
                Evidence + Integrity
              </div>

              <span>↓</span>

              <div>
                Responder Dashboard
              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;