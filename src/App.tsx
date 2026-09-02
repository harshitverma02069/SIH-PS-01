import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type RiskZone = {
  id: number;
  name: string;
  state: string;
  score: number;
  level: string;
  rainfall: number;
  soil_moisture: number;
  slope: number;
};

const demoZones: RiskZone[] = [
  { id: 1, name: "Aizawl North", state: "Mizoram", score: 87, level: "CRITICAL", rainfall: 182, soil_moisture: 81, slope: 43 },
  { id: 2, name: "Gangtok East", state: "Sikkim", score: 74, level: "HIGH", rainfall: 146, soil_moisture: 72, slope: 38 },
  { id: 3, name: "Shillong Hills", state: "Meghalaya", score: 63, level: "HIGH", rainfall: 128, soil_moisture: 68, slope: 31 },
  { id: 4, name: "Kohima West", state: "Nagaland", score: 48, level: "MODERATE", rainfall: 94, soil_moisture: 54, slope: 27 },
  { id: 5, name: "Itanagar South", state: "Arunachal Pradesh", score: 22, level: "LOW", rainfall: 61, soil_moisture: 38, slope: 19 },
];

function App() {
  const [page, setPage] = useState("dashboard");
  const [backend, setBackend] = useState("Checking...");
  const [zones, setZones] = useState<RiskZone[]>(demoZones);
  const [dataSource, setDataSource] = useState("DEMO");

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(() => {
        setBackend("ONLINE");

        return fetch(`${API}/api/risk-zones`);
      })
      .then(r => {
        if (!r) return null;
        return r.json();
      })
      .then(data => {
        if (data?.zones && Array.isArray(data.zones)) {
          setZones(data.zones);
          setDataSource("LIVE API");
        }
      })
      .catch(() => {
        setBackend("DEMO MODE");
        setDataSource("DEMO");
      });
  }, []);

  const critical = zones.filter(z => z.level === "CRITICAL").length;
  const high = zones.filter(z => z.level === "HIGH").length;

  return (
    <div className="app">
      <header>
        <div>
          <div className="brand">NER LANDSLIDE</div>
          <div className="subtitle">AI-Powered Early Warning & Monitoring Platform</div>
        </div>
        <div className="status">● BACKEND {backend}</div>
      </header>

      <nav>
        {[
          ["dashboard", "📊 Dashboard"],
          ["map", "🗺️ Risk Map"],
          ["prediction", "🤖 Prediction"],
          ["alerts", "🚨 Alerts"],
          ["report", "📸 Report Incident"],
          ["history", "📋 Incident History"],
          ["roads", "🚧 Roads"],
          ["weather", "🌧️ Weather"],
          ["emergency", "🚑 Emergency"],
        ].map(([id, label]) => (
          <button className={page === id ? "active" : ""} onClick={() => setPage(id)} key={id}>
            {label}
          </button>
        ))}
      </nav>

      <main>
        {page === "dashboard" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">NORTH EASTERN REGION</p>
                <h1>Landslide Early Warning System</h1>
                <p>Monitor vulnerable zones, assess environmental risk and prioritize emergency response.</p>
              </div>
              <div className="heroBadge">LIVE MONITORING</div>
            </section>

            <div className="stats">
              <Card title="Monitored Zones" value={String(zones.length)} />
              <Card title="Critical Zones" value={String(critical)} danger />
              <Card title="High Risk Zones" value={String(high)} />
              <Card title="Active Alerts" value={String(critical + high)} />
            </div>

            <section className="grid">
              <Panel title={`Risk Overview • ${dataSource}`}>
                {zones.map(z => <RiskRow zone={z} key={z.id} />)}
              </Panel>

              <Panel title="System Capabilities">
                <Feature text="Rainfall & weather-linked risk analysis" />
                <Feature text="Soil moisture and terrain indicators" />
                <Feature text="GIS-based vulnerable zone mapping" />
                <Feature text="Citizen and field officer reporting" />
                <Feature text="Emergency response prioritisation" />
                <Feature text="Alert-ready architecture" />
              </Panel>
            </section>
          </>
        )}

        {page === "map" && <MapPage zones={zones} />}
        {page === "prediction" && <PredictionPage zones={zones} />}
        {page === "alerts" && <AlertsPage />}
        {page === "report" && <ReportPage />}
        {page === "history" && <ReportsPage />}
        {page === "roads" && <RoadPage />}
        {page === "weather" && <WeatherPage />}
        {page === "emergency" && <EmergencyPage />}
      </main>

      <footer>
        NER Landslide Monitoring Platform • SIH PS-01 • Baseline/demo data is clearly labelled
      </footer>
    </div>
  );
}

function Card({ title, value, danger = false }: { title: string; value: string; danger?: boolean }) {
  return <div className={`card ${danger ? "danger" : ""}`}><span>{title}</span><strong>{value}</strong></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function RiskRow({ zone }: { zone: RiskZone }) {
  return (
    <div className="riskRow">
      <div><strong>{zone.name}</strong><small>{zone.state}</small></div>
      <span className={`pill ${zone.level.toLowerCase()}`}>{zone.level}</span>
      <strong>{zone.score}/100</strong>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return <div className="feature">✓ <span>{text}</span></div>;
}

function MapPage({ zones }: { zones: RiskZone[] }) {
  useEffect(() => {
    const map = L.map("risk-map").setView([25.8, 91.8], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const locations: Record<string, [number, number]> = {
      "Aizawl North": [23.7271, 92.7176],
      "Gangtok East": [27.3389, 88.6065],
      "Shillong Hills": [25.5788, 91.8933],
      "Kohima West": [25.6751, 94.1086],
      "Itanagar South": [27.0844, 93.6053],
    };

    zones.forEach(z => {
      const position = locations[z.name];
      if (!position) return;

      const color =
        z.level === "CRITICAL" ? "#dc2626" :
        z.level === "HIGH" ? "#ea580c" :
        z.level === "MODERATE" ? "#ca8a04" :
        "#16a34a";

      const marker = L.circleMarker(position, {
        radius: 10,
        color,
        fillColor: color,
        fillOpacity: 0.75,
        weight: 3,
      }).addTo(map);

      marker.bindPopup(`
        <strong>${z.name}</strong><br/>
        ${z.state}<br/>
        <b>Risk: ${z.score}/100</b><br/>
        Level: ${z.level}<br/>
        Rainfall: ${z.rainfall} mm<br/>
        Soil Moisture: ${z.soil_moisture}%<br/>
        Slope: ${z.slope}°
      `);
    });

    return () => {
      map.remove();
    };
  }, [zones]);

  return (
    <Page
      title="🗺️ GIS Risk Map"
      description="Live vulnerable zones across the North Eastern Region."
    >
      <div
        id="risk-map"
        style={{
          height: "560px",
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #ddd",
        }}
      />

      <div className="mapLegend">
        <strong>Risk Level</strong>
        <span><i className="legendDot criticalDot" /> Critical</span>
        <span><i className="legendDot highDot" /> High</span>
        <span><i className="legendDot moderateDot" /> Moderate</span>
        <span><i className="legendDot lowDot" /> Low</span>
      </div>
    </Page>
  );
}

function PredictionPage({ zones }: { zones: RiskZone[] }) {
  const [selectedId, setSelectedId] = useState(zones[0]?.id ?? 1);

  const z = zones.find(zone => zone.id === selectedId) ?? zones[0];

  if (!z) {
    return (
      <Page
        title="🤖 AI Risk Prediction"
        description="Live environmental risk assessment."
      >
        <div className="notice">No risk-zone data available.</div>
      </Page>
    );
  }

  const rainfallPercent = Math.min(100, Math.round((z.rainfall / 200) * 100));
  const soilPercent = Math.min(100, Math.round(z.soil_moisture));
  const slopePercent = Math.min(100, Math.round((z.slope / 45) * 100));

  const levelClass = z.level.toLowerCase();

  return (
    <Page
      title="🤖 AI Risk Prediction"
      description="Live risk assessment based on environmental indicators."
    >
      <div className="prediction">
        <label>
          Select Risk Zone
          <select
            value={selectedId}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>
                {zone.name} — {zone.level} ({zone.score}/100)
              </option>
            ))}
          </select>
        </label>

        <h2>{z.name}, {z.state}</h2>

        <div className="bigScore">
          {z.score}<small>/100</small>
        </div>

        <div className={`pill ${levelClass}`}>{z.level}</div>

        <Metric
          name="Rainfall"
          value={`${z.rainfall} mm`}
          percent={rainfallPercent}
        />

        <Metric
          name="Soil Moisture"
          value={`${z.soil_moisture}%`}
          percent={soilPercent}
        />

        <Metric
          name="Slope"
          value={`${z.slope}°`}
          percent={slopePercent}
        />

        <Metric
          name="Risk Score"
          value={`${z.score}/100`}
          percent={z.score}
        />

        <div className="notice">
          🌐 LIVE DATA • Weather-linked baseline risk assessment
          <br />
          Risk level: <strong>{z.level}</strong> • Score: <strong>{z.score}/100</strong>
        </div>

        <div className="notice">
          ⚠️ This is a baseline/demo risk engine and is not a scientifically
          validated prediction model.
        </div>
      </div>
    </Page>
  );
}

function Metric({ name, value, percent }: { name: string; value: string; percent: number }) {
  return <div className="metric"><div><span>{name}</span><strong>{value}</strong></div><div className="bar"><i style={{ width: `${percent}%` }} /></div></div>;
}

function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [source, setSource] = useState("UNKNOWN");
  const [sourceType, setSourceType] = useState("UNKNOWN");
  const [timestamp, setTimestamp] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/alerts`)
      .then(r => r.json())
      .then(data => {
        setAlerts(data.alerts || []);
        setSource(data.source || "UNKNOWN");
        setSourceType(data.source_type || "UNKNOWN");
        setTimestamp(data.timestamp || "");
      })
      .catch(() => {
        setAlerts([]);
        setSource("UNAVAILABLE");
        setSourceType("OFFLINE");
      })
      .finally(() => setLoading(false));
  }, []);

  const critical = alerts.filter(a => a.severity === "CRITICAL").length;
  const high = alerts.filter(a => a.severity === "HIGH").length;

  return (
    <Page
      title="🚨 Alerts"
      description="Live risk-based warnings and notification queue."
    >
      <div className="stats">
        <Card title="Active Alerts" value={String(alerts.length)} />
        <Card title="Critical" value={String(critical)} danger />
        <Card title="High Risk" value={String(high)} />
      </div>

      <div className="notice">
        🌐 <strong>{source}</strong> • {sourceType}
        {timestamp && <> • Updated: {timestamp}</>}
      </div>

      {loading ? (
        <div className="notice">Loading live alerts...</div>
      ) : alerts.length > 0 ? (
        alerts.map(a => (
          <Alert
            key={a.id}
            level={a.severity}
            location={a.location}
            text={`${a.message} Risk score: ${a.risk_score}/100`}
          />
        ))
      ) : (
        <div className="notice">🟢 No active alerts.</div>
      )}
    </Page>
  );
}

function Alert({ level, location, text }: { level: string; location: string; text: string }) {
  return <div className="alert"><span className={`pill ${level.toLowerCase()}`}>{level}</span><div><strong>{location}</strong><p>{text}</p></div><button>View</button></div>;
}

function ReportPage() {
  const [incidentType, setIncidentType] = useState("Landslide");
  const [severity, setSeverity] = useState("High");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submitReport() {
    setError("");
    setSent(false);

    if (!description.trim()) {
      setError("Please describe the incident.");
      return;
    }

    const form = new FormData();
    form.append("client_report_id", crypto.randomUUID());
    form.append("incident_type", incidentType);
    form.append("severity", severity);
    form.append("description", description);
    const location = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    form.append("latitude", String(location.coords.latitude));
    form.append("longitude", String(location.coords.longitude));

    if (files) {
      Array.from(files).forEach(file => {
        form.append("files", file);
      });
    }

    try {
      const response = await fetch(`${API}/api/reports`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit report");
      }

      setSent(true);
      setDescription("");
      setFiles(null);
    } catch (err: any) {
      setError(err.message || "Failed to submit report");
    }
  }

  return <Page title="📸 Report Incident" description="Submit a geo-tagged field or citizen observation.">
    <div className="form">
      <label>
        Incident Type
        <select value={incidentType} onChange={e => setIncidentType(e.target.value)}>
          <option>Landslide</option>
          <option>Road Blockage</option>
          <option>Slope Crack</option>
          <option>Flash Flood</option>
        </select>
      </label>

      <label>
        Severity
        <select value={severity} onChange={e => setSeverity(e.target.value)}>
          <option>High</option>
          <option>Critical</option>
          <option>Moderate</option>
          <option>Low</option>
        </select>
      </label>

      <label>
        Description
        <textarea
          placeholder="Describe the incident..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </label>

      <div className="location">
        📍 GPS Location: Captured automatically when submitting
      </div>

      <label>
        Evidence
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={e => setFiles(e.target.files)}
        />
      </label>

      <button className="primary" onClick={submitReport}>
        SUBMIT GEO-TAGGED REPORT
      </button>

      {sent && <div className="success">✓ Report received successfully.</div>}
      {error && <div className="notice">⚠️ {error}</div>}
    </div>
  </Page>;
}

function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/reports`)
      .then(r => r.json())
      .then(data => setReports(data.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  return <Page title="📋 Incident History" description="Previously submitted field and citizen reports.">
    {loading ? (
      <div className="notice">Loading incident reports...</div>
    ) : reports.length > 0 ? (
      <div className="table">
        {reports.map(report => (
          <div className="tableRow" key={report.report_id}>
            <strong>{report.incident_type}</strong>
            <span>{report.description}</span>
            <span className={`pill ${report.severity.toLowerCase()}`}>
              {report.severity}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <div className="notice">No incident reports submitted yet.</div>
    )}
  </Page>;
}

function RoadPage() {
  const [roads, setRoads] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/roads/status`)
      .then(r => r.json())
      .then(data => setRoads(data.roads || []))
      .catch(() => setRoads([]));
  }, []);

  return <Page title="🚧 Road Connectivity" description="Monitor vulnerable transportation routes.">
    {roads.length > 0
      ? <DataTable rows={roads.map(r => [
          r.name || r.road || r.id,
          r.route || r.location || "NER Corridor",
          r.status
        ])} />
      : <div className="notice">Loading road connectivity data...</div>}
  </Page>;
}
function WeatherPage() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/weather`).then(r => r.json()).then(setWeather).catch(() => setWeather(null));
  }, []);

  return <Page title="🌧️ Weather Risk" description="Live weather-linked risk indicators.">
    {weather ? (
      <>
        <div className="stats">
          <Card title="Rainfall (24h)" value={`${weather.rainfall_24h_mm} mm`} />
          <Card title="Soil Moisture" value={`${weather.soil_moisture_percent}%`} />
          <Card title="Temperature" value={`${weather.temperature_c}°C`} />
        </div>
        <div className="notice">
          🟢 LIVE DATA • {weather.source} • {weather.location} • Risk: {weather.risk}
        </div>
      </>
    ) : <div className="notice">Loading live weather data...</div>}
  </Page>;
}

function EmergencyPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dispatching, setDispatching] = useState<number | null>(null);
  const [resolved, setResolved] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API}/api/alerts`)
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]));
  }, []);

  async function dispatchEmergency(alert: any) {
    setDispatching(alert.id);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/emergency/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: alert.severity,
          location: alert.location,
          risk_score: alert.risk_score,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Dispatch failed");
      }

      setMessage(`🚑 Response dispatched to ${alert.location}`);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setDispatching(null);
    }
  }

  async function resolveEmergency(alert: any) {
    setMessage("");

    try {
      const response = await fetch(`${API}/api/emergency/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: alert.id,
          location: alert.location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resolve failed");
      }

      setResolved(prev => [...prev, alert.id]);
      setMessage(`✅ Incident at ${alert.location} marked as resolved`);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  }

  return <Page
    title="🚑 Emergency Prioritisation"
    description="Prioritize field response using live risk alerts."
  >
    {message && <div className="notice">{message}</div>}

    {alerts.length > 0
      ? alerts.map((a, i) => {
          const isResolved = resolved.includes(a.id);

          return (
            <div className="card" key={a.id}>
              <Alert
                level={a.severity}
                location={`P${i + 1} — ${a.location}`}
                text={`Risk ${a.risk_score} • ${a.message}`}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                {!isResolved && (
                  <>
                    <button
                      onClick={() => dispatchEmergency(a)}
                      disabled={dispatching === a.id}
                    >
                      {dispatching === a.id ? "Dispatching..." : "🚑 Dispatch Response"}
                    </button>

                    <button onClick={() => resolveEmergency(a)}>
                      ✅ Resolve Incident
                    </button>
                  </>
                )}

                {isResolved && (
                  <div className="notice">
                    ✅ RESOLVED
                  </div>
                )}
              </div>
            </div>
          );
        })
      : <div className="notice">No active emergency alerts.</div>}
  </Page>;
}
function DataTable({ rows }: { rows: string[][] }) {
  return <div className="table">{rows.map(r => <div className="tableRow" key={r[0]}><strong>{r[0]}</strong><span>{r[1]}</span><span className={`pill ${r[2] === "BLOCKED" ? "critical" : r[2] === "AT RISK" ? "high" : "low"}`}>{r[2]}</span></div>)}</div>;
}

function Page({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <><section className="pageHead"><p className="eyebrow">NER DISASTER MANAGEMENT</p><h1>{title}</h1><p>{description}</p></section>{children}</>;
}

export default App;
