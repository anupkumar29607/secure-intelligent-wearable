import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load existing incidents from the backend when the page opens
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/incidents"
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
            status: latest.status,
          });
        }
      } catch (err) {
        console.error("Failed to load incidents:", err);
      }
    };

    loadIncidents();
  }, []);

  // Activate SOS
  const activateSOS = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/incidents/sos",
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

      if (!response.ok) {
        throw new Error("Failed to activate SOS");
      }

      const data = await response.json();

      setIncident(data);
    } catch (err) {
      setError(
        "Unable to connect to backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Secure Intelligent Wearable</h1>
          <p>Personal Safety & Emergency Response System</p>
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

            <h2>Emergency Response Dashboard</h2>

            <p>
              Monitor wearable status, emergency incidents, risk analysis,
              location and evidence integrity from one dashboard.
            </p>
          </div>

          <button
            className="sos-button"
            onClick={activateSOS}
            disabled={loading}
          >
            {loading ? "ACTIVATING..." : "🚨 ACTIVATE SOS"}
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
              <strong>🚨 SOS ACTIVATED</strong>

              <p>
                Incident ID: <b>{incident.incident_id}</b>
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
            <strong>{incident ? "HIGH" : "LOW"}</strong>
            <small>[SIMULATED]</small>
          </div>

          <div className="card">
            <span>Location</span>
            <strong>AVAILABLE</strong>
            <small>[SIMULATED]</small>
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
            <h3>Latest Incident</h3>

            {incident ? (
              <div className="incident-details">

                <div className="empty-icon">
                  🚨
                </div>

                <h4>Active Emergency</h4>

                <p>
                  <b>Incident:</b>{" "}
                  {incident.incident_id}
                </p>

                <p>
                  <b>Type:</b> SOS
                </p>

                <p>
                  <b>Status:</b>{" "}
                  {incident.status}
                </p>

                <p>
                  <b>Source:</b>{" "}
                  DIGITAL_SIMULATOR
                </p>

              </div>
            ) : (
              <div className="empty-state">

                <div className="empty-icon">
                  🛡️
                </div>

                <h4>No Active Incidents</h4>

                <p>
                  Emergency incidents created by the wearable
                  will appear here.
                </p>

              </div>
            )}
          </div>

          {/* System Pipeline */}
          <div className="panel">

            <h3>System Pipeline</h3>

            <div className="pipeline">

              <div>
                Wearable Simulator
              </div>

              <span>↓</span>

              <div>
                FastAPI Backend
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