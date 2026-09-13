import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const SIMULATED_LOCATION = {
  latitude: 28.6139,
  longitude: 77.2090,
};

function App() {
  const [incident, setIncident] = useState(null);
  const [risk, setRisk] = useState({
    level: "LOW",
    reason: "Waiting for wearable data",
  });

  const [sensor, setSensor] = useState({
    acceleration: 1.2,
    gyro: 0.8,
    fallDetected: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("System ready");
  const [error, setError] = useState("");

  const [evidence, setEvidence] = useState({
    captured: false,
    encrypted: false,
    hashed: false,
    blockchain: false,
  });

  const [responder, setResponder] = useState({
    alertSent: false,
    acknowledged: false,
    resolved: false,
  });

  useEffect(() => {
    loadLatestIncident();
  }, []);

  const loadLatestIncident = async () => {
    try {
      const response = await fetch(`${API_URL}/api/incidents`);

      if (!response.ok) {
        throw new Error("Unable to load incidents");
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1];

        setIncident(latest);

        setSensor({
          acceleration: latest.acceleration ?? 1.2,
          gyro: latest.gyro ?? 0.8,
          fallDetected: latest.fall_detected ?? false,
        });

        if (latest.fall_detected) {
          setRisk({
            level: "HIGH",
            reason: "Fall event detected",
          });
        }
      }
    } catch (err) {
      console.log("Initial incident load skipped:", err.message);
    }
  };

  const activateSOS = async () => {
    setLoading(true);
    setError("");
    setMessage("Activating emergency protocol...");

    try {
      const sosResponse = await fetch(`${API_URL}/api/incidents/sos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "DIGITAL_SIMULATOR",
        }),
      });

      if (!sosResponse.ok) {
        throw new Error("SOS request failed");
      }

      const sosData = await sosResponse.json();

      const locationResponse = await fetch(
        `${API_URL}/api/incidents/${sosData.incident_id}/location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(SIMULATED_LOCATION),
        }
      );

      if (!locationResponse.ok) {
        throw new Error("GPS update failed");
      }

      const locationData = await locationResponse.json();

      const incidentData = {
        ...sosData,
        type: "SOS",
        source: "DIGITAL_SIMULATOR",
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        created_at: new Date().toISOString(),
        acceleration: 1.2,
        gyro: 0.8,
        fall_detected: false,
      };

      setIncident(incidentData);

      setSensor({
        acceleration: 1.2,
        gyro: 0.8,
        fallDetected: false,
      });

      setRisk({
        level: "HIGH",
        reason: "SOS activated",
      });

      setEvidence({
        captured: false,
        encrypted: false,
        hashed: false,
        blockchain: false,
      });

      setResponder({
        alertSent: false,
        acknowledged: false,
        resolved: false,
      });

      setMessage(`Emergency incident ${sosData.incident_id} created`);

      await simulateEmergencyAlert();
    } catch (err) {
      console.error(err);
      setError(
        "Unable to complete emergency request. Make sure FastAPI is running."
      );
      setMessage("Emergency protocol failed");
    } finally {
      setLoading(false);
    }
  };

  const sendMotion = async (fallDetected) => {
    if (!incident?.incident_id) {
      setError("Activate SOS first");
      return;
    }

    setLoading(true);
    setError("");

    const acceleration = fallDetected ? 8.7 : 1.2;
    const gyro = fallDetected ? 145.5 : 0.8;

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${incident.incident_id}/motion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acceleration,
            gyro,
            fall_detected: fallDetected,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Motion update failed");
      }

      const data = await response.json();

      setSensor({
        acceleration,
        gyro,
        fallDetected,
      });

      setRisk({
        level: fallDetected ? "HIGH" : "LOW",
        reason: fallDetected
          ? "Fall event detected"
          : "Normal motion detected",
      });

      setIncident((previous) => ({
        ...previous,
        acceleration,
        gyro,
        fall_detected: fallDetected,
      }));

      if (fallDetected) {
        setMessage("⚠️ Fall detected — emergency risk elevated");
        await simulateEvidencePipeline();
      } else {
        setMessage("Normal wearable movement detected");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to send motion data");
    } finally {
      setLoading(false);
    }
  };

  const analyzeRisk = async () => {
    if (!incident?.incident_id) {
      setError("Activate SOS first");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${incident.incident_id}/risk`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Risk analysis failed");
      }

      const data = await response.json();

      setRisk({
        level: data.risk_level,
        reason: data.reason,
      });

      setMessage("AI risk analysis completed");
    } catch (err) {
      console.error(err);

      // Fallback keeps the prototype usable if the explicit endpoint
      // is temporarily unavailable.
      setRisk({
        level: sensor.fallDetected ? "HIGH" : "HIGH",
        reason: sensor.fallDetected
          ? "SOS and fall event detected"
          : "SOS activated",
      });

      setMessage("AI risk analysis completed [SIMULATED FALLBACK]");
    } finally {
      setLoading(false);
    }
  };

  const simulateEmergencyAlert = async () => {
    setResponder({
      alertSent: true,
      acknowledged: false,
      resolved: false,
    });

    setMessage("🚨 Emergency responder alert sent [SIMULATED]");
  };

  const simulateEvidencePipeline = async () => {
    setEvidence({
      captured: true,
      encrypted: false,
      hashed: false,
      blockchain: false,
    });

    setMessage("📷 Evidence captured [SIMULATED]");

    await new Promise((resolve) => setTimeout(resolve, 500));

    setEvidence({
      captured: true,
      encrypted: true,
      hashed: false,
      blockchain: false,
    });

    setMessage("🔐 Evidence encrypted [SIMULATED]");

    await new Promise((resolve) => setTimeout(resolve, 500));

    setEvidence({
      captured: true,
      encrypted: true,
      hashed: true,
      blockchain: false,
    });

    setMessage("🔑 SHA-256 evidence hash generated [SIMULATED]");

    await new Promise((resolve) => setTimeout(resolve, 500));

    setEvidence({
      captured: true,
      encrypted: true,
      hashed: true,
      blockchain: true,
    });

    setMessage("⛓️ Evidence integrity recorded on blockchain [SIMULATED]");
  };

  const acknowledgeIncident = () => {
    setResponder((previous) => ({
      ...previous,
      acknowledged: true,
    }));

    setMessage("Responder acknowledged incident");
  };

  const resolveIncident = () => {
    setResponder((previous) => ({
      ...previous,
      resolved: true,
    }));

    setMessage("Incident resolved by responder");
  };

  const riskClass = risk.level.toLowerCase();

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">
            <span className="brand-icon">🛡️</span>
            <div>
              <h1>Secure Intelligent Wearable</h1>
              <p>Personal Safety & Emergency Response Platform</p>
            </div>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          SYSTEM ONLINE
        </div>
      </header>

      <main className="dashboard">
        <section className="hero-card">
          <div>
            <span className="eyebrow">DIGITAL WEARABLE SIMULATOR</span>
            <h2>Emergency Response Command Center</h2>
            <p>
              Real-time simulated wearable telemetry, AI risk analysis and
              secure emergency evidence processing.
            </p>
          </div>

          <button
            className="sos-button"
            onClick={activateSOS}
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "🚨 ACTIVATE SOS"}
          </button>
        </section>

        {message && <div className="message-bar">{message}</div>}

        {error && <div className="error-bar">{error}</div>}

        <section className="stats-grid">
          <div className="stat-card">
            <span>DEVICE</span>
            <strong>ONLINE</strong>
            <small>Digital Simulator</small>
          </div>

          <div className="stat-card">
            <span>INCIDENT</span>
            <strong>{incident?.incident_id || "—"}</strong>
            <small>{incident?.status || "STANDBY"}</small>
          </div>

          <div className={`stat-card risk-mini ${riskClass}`}>
            <span>AI RISK</span>
            <strong>{risk.level}</strong>
            <small>[SIMULATED] Risk Engine</small>
          </div>

          <div className="stat-card">
            <span>RESPONDER</span>
            <strong>
              {responder.resolved
                ? "RESOLVED"
                : responder.acknowledged
                ? "ACKNOWLEDGED"
                : responder.alertSent
                ? "ALERTED"
                : "STANDBY"}
            </strong>
            <small>Emergency Response</small>
          </div>
        </section>

        <section className="main-grid">
          <div className={`panel risk-panel ${riskClass}`}>
            <div className="panel-header">
              <div>
                <span className="panel-label">AI RISK ANALYSIS</span>
                <h3>Threat Assessment</h3>
              </div>
              <span className={`risk-badge ${riskClass}`}>
                {risk.level}
              </span>
            </div>

            <div className="risk-content">
              <div className="risk-icon">
                {risk.level === "HIGH"
                  ? "⚠️"
                  : risk.level === "MEDIUM"
                  ? "🟠"
                  : "🟢"}
              </div>

              <div>
                <h4>{risk.reason}</h4>
                <p>
                  [SIMULATED] Rule-based AI risk assessment using SOS, fall and
                  wearable sensor state.
                </p>
              </div>
            </div>

            <button className="secondary-button" onClick={analyzeRisk}>
              🧠 RUN AI ANALYSIS
            </button>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-label">WEARABLE TELEMETRY</span>
                <h3>Sensor Data</h3>
              </div>
              <span className="live-pill">LIVE</span>
            </div>

            <div className="sensor-grid">
              <div className="sensor-card">
                <span>ACCELERATION</span>
                <strong>{sensor.acceleration.toFixed(1)}</strong>
                <small>m/s² [SIMULATED]</small>
              </div>

              <div className="sensor-card">
                <span>GYROSCOPE</span>
                <strong>{sensor.gyro.toFixed(1)}</strong>
                <small>°/s [SIMULATED]</small>
              </div>

              <div className="sensor-card">
                <span>FALL STATUS</span>
                <strong>{sensor.fallDetected ? "DETECTED" : "NORMAL"}</strong>
                <small>[SIMULATED]</small>
              </div>
            </div>

            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => sendMotion(false)}
              >
                📡 NORMAL MOTION
              </button>

              <button
                className="danger-outline"
                onClick={() => sendMotion(true)}
              >
                ⚠️ SIMULATE FALL
              </button>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">LOCATION INTELLIGENCE</span>
              <h3>Simulated GPS Position</h3>
            </div>

            <span className="location-pill">GPS ACTIVE</span>
          </div>

          <div className="location-grid">
            <div>
              <span>LATITUDE</span>
              <strong>
                {incident?.latitude ?? SIMULATED_LOCATION.latitude}
              </strong>
            </div>

            <div>
              <span>LONGITUDE</span>
              <strong>
                {incident?.longitude ?? SIMULATED_LOCATION.longitude}
              </strong>
            </div>

            <div>
              <span>LOCATION SOURCE</span>
              <strong>[SIMULATED]</strong>
            </div>

            <div className="map-placeholder">
              <span>📍</span>
              <strong>Emergency Location</strong>
              <small>28.6139° N, 77.2090° E</small>
            </div>
          </div>
        </section>

        <section className="pipeline-section">
          <div className="section-title">
            <div>
              <span className="panel-label">SECURITY PIPELINE</span>
              <h3>Evidence Integrity Chain</h3>
            </div>
            <span>[SIMULATED MVP]</span>
          </div>

          <div className="pipeline">
            <PipelineStep
              icon="📷"
              title="Capture"
              active={evidence.captured}
            />
            <PipelineArrow />
            <PipelineStep
              icon="🔐"
              title="Encrypt"
              active={evidence.encrypted}
            />
            <PipelineArrow />
            <PipelineStep
              icon="🔑"
              title="SHA-256"
              active={evidence.hashed}
            />
            <PipelineArrow />
            <PipelineStep
              icon="⛓️"
              title="Blockchain"
              active={evidence.blockchain}
            />
          </div>

          <button
            className="secondary-button wide-button"
            onClick={simulateEvidencePipeline}
            disabled={!incident}
          >
            🔒 PROCESS EMERGENCY EVIDENCE
          </button>
        </section>

        <section className="main-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-label">EMERGENCY RESPONSE</span>
                <h3>Responder Alert</h3>
              </div>

              <span
                className={
                  responder.alertSent
                    ? "response-status active"
                    : "response-status"
                }
              >
                {responder.alertSent ? "ALERT SENT" : "STANDBY"}
              </span>
            </div>

            <div className="response-list">
              <ResponseRow
                label="Emergency alert"
                value={responder.alertSent ? "SENT" : "WAITING"}
                active={responder.alertSent}
              />

              <ResponseRow
                label="Responder acknowledgement"
                value={responder.acknowledged ? "ACKNOWLEDGED" : "PENDING"}
                active={responder.acknowledged}
              />

              <ResponseRow
                label="Incident resolution"
                value={responder.resolved ? "RESOLVED" : "ACTIVE"}
                active={responder.resolved}
              />
            </div>

            <div className="button-row">
              <button
                className="secondary-button"
                onClick={acknowledgeIncident}
                disabled={!responder.alertSent || responder.acknowledged}
              >
                ✓ ACKNOWLEDGE
              </button>

              <button
                className="success-button"
                onClick={resolveIncident}
                disabled={!responder.acknowledged || responder.resolved}
              >
                ✓ RESOLVE INCIDENT
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-label">INCIDENT RECORD</span>
                <h3>Event Details</h3>
              </div>
            </div>

            <div className="record-list">
              <RecordRow
                label="Incident ID"
                value={incident?.incident_id || "No active incident"}
              />
              <RecordRow
                label="Event type"
                value={incident?.type || "—"}
              />
              <RecordRow
                label="Source"
                value={incident?.source || "DIGITAL_SIMULATOR"}
              />
              <RecordRow
                label="Status"
                value={responder.resolved ? "RESOLVED" : incident?.status || "STANDBY"}
              />
              <RecordRow
                label="Security"
                value={
                  evidence.blockchain
                    ? "HASH + BLOCKCHAIN RECORDED"
                    : "PROCESSING"
                }
              />
            </div>
          </div>
        </section>

        <footer>
          <span>Secure Intelligent Wearable</span>
          <span>SIH 2026 Prototype • [SIMULATED HARDWARE]</span>
        </footer>
      </main>
    </div>
  );
}

function PipelineStep({ icon, title, active }) {
  return (
    <div className={`pipeline-step ${active ? "active" : ""}`}>
      <div className="pipeline-icon">{active ? "✓" : icon}</div>
      <strong>{title}</strong>
      <small>{active ? "COMPLETED" : "WAITING"}</small>
    </div>
  );
}

function PipelineArrow() {
  return <div className="pipeline-arrow">→</div>;
}

function ResponseRow({ label, value, active }) {
  return (
    <div className="response-row">
      <span>{label}</span>
      <strong className={active ? "active-text" : ""}>{value}</strong>
    </div>
  );
}

function RecordRow({ label, value }) {
  return (
    <div className="record-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;