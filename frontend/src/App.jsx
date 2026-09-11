import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load latest incident from backend
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

          setIncident({
            success: true,
            incident_id: latest.incident_id,
            type: latest.type,
            status: latest.status,
            source: latest.source,
            created_at: latest.created_at,
            latitude: latest.latitude,
            longitude: latest.longitude,
          });
        }
      } catch (err) {
        console.error("Failed to load incidents:", err);
      }
    };

    loadIncidents();
  }, []);

  // Activate SOS + automatically attach simulated GPS
  const activateSOS = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Create SOS incident
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

      // Step 2: Simulated GPS coordinates
      const simulatedLatitude = 28.6139;
      const simulatedLongitude = 77.2090;

      // Step 3: Attach GPS to the new incident
      const locationResponse = await fetch(
        `${API_URL}/api/incidents/${sosData.incident_id}/location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: simulatedLatitude,
            longitude: simulatedLongitude,
          }),
        }
      );

      if (!locationResponse.ok) {
        throw new Error("Failed to update location");
      }

      const locationData = await locationResponse.json();

      // Step 4: Update dashboard
      setIncident({
        ...sosData,
        type: "SOS",
        source: "DIGITAL_SIMULATOR",
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });

    } catch (err) {
      console.error("Emergency request failed:", err);

      setError(
        "Unable to complete emergency request. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

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

        {/* Hero Section */}
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
              risk analysis, location and evidence integrity
              from one dashboard.
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

        {/* Error Message */}
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
              {incident ? "HIGH" : "LOW"}
            </strong>

            <small>[SIMULATED]</small>
          </div>

          <div className="card">
            <span>Location</span>

            <strong>
              {incident?.latitude !== null &&
              incident?.latitude !== undefined &&
              incident?.longitude !== null &&
              incident?.longitude !== undefined
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
                  {incident.type || "SOS"}
                </p>

                <p>
                  <b>Status:</b>{" "}
                  {incident.status}
                </p>

                <p>
                  <b>Source:</b>{" "}
                  {incident.source ||
                    "DIGITAL_SIMULATOR"}
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

          {/* System Pipeline */}
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
                FastAPI Backend
              </div>

              <span>↓</span>

              <div>
                GPS Location
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