import { useEffect, useState } from "react";

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
  return <Page title="🗺️ GIS Risk Map" description="Vulnerable locations across the North Eastern Region.">
    <div className="map">
      {zones.map((z, i) => <div className={`mapPoint p${i + 1}`} key={z.id} title={z.name}>●<span>{z.name}<br />Risk {z.score}</span></div>)}
      <div className="mapCenter">NORTH EASTERN REGION<br /><small>Interactive GIS layer — demo visualization</small></div>
    </div>
  </Page>;
}

function PredictionPage({ zones }: { zones: RiskZone[] }) {
  const z = zones[0];
  return <Page title="🤖 AI Risk Prediction" description="Baseline risk assessment using environmental indicators.">
    <div className="prediction">
      <h2>{z.name}, {z.state}</h2>
      <div className="bigScore">{z.score}<small>/100</small></div>
      <div className="pill critical">{z.level}</div>
      <Metric name="Rainfall" value={`${z.rainfall} mm`} percent={91} />
      <Metric name="Soil Moisture" value={`${z.soil_moisture}%`} percent={81} />
      <Metric name="Slope" value={`${z.slope}°`} percent={72} />
      <Metric name="Historical susceptibility" value="High" percent={76} />
      <div className="notice">⚠️ Baseline/demo risk engine. This is not a scientifically validated prediction model.</div>
    </div>
  </Page>;
}

function Metric({ name, value, percent }: { name: string; value: string; percent: number }) {
  return <div className="metric"><div><span>{name}</span><strong>{value}</strong></div><div className="bar"><i style={{ width: `${percent}%` }} /></div></div>;
}

function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/alerts`)
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]));
  }, []);

  return <Page title="🚨 Alerts" description="Live risk-based warnings and notification queue.">
    {alerts.length > 0
      ? alerts.map(a => (
          <Alert
            key={a.id}
            level={a.severity}
            location={a.location}
            text={a.message}
          />
        ))
      : <div className="notice">No active alerts.</div>}
  </Page>;
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
    form.append("incident_type", incidentType);
    form.append("severity", severity);
    form.append("description", description);
    form.append("latitude", "23.1645");
    form.append("longitude", "92.9376");

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

      <div className="location">📍 GPS Location: Ready to capture</div>

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

  useEffect(() => {
    fetch(`${API}/api/alerts`)
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]));
  }, []);

  return <Page title="🚑 Emergency Prioritisation" description="Prioritize field response using live risk alerts.">
    {alerts.length > 0
      ? alerts.map((a, i) => (
          <Alert
            key={a.id}
            level={a.severity}
            location={`P${i + 1} — ${a.location}`}
            text={`Risk ${a.risk_score} • ${a.message}`}
          />
        ))
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
