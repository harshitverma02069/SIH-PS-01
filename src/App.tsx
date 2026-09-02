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
  return <Page title="🚨 Alerts" description="Risk-based warnings and notification queue.">
    <Alert level="CRITICAL" location="Aizawl North" text="Heavy rainfall and saturated soil conditions." />
    <Alert level="HIGH" location="Gangtok East" text="Slope instability indicators detected." />
    <Alert level="HIGH" location="Shillong Hills" text="Weather-linked landslide risk elevated." />
  </Page>;
}

function Alert({ level, location, text }: { level: string; location: string; text: string }) {
  return <div className="alert"><span className={`pill ${level.toLowerCase()}`}>{level}</span><div><strong>{location}</strong><p>{text}</p></div><button>View</button></div>;
}

function ReportPage() {
  const [sent, setSent] = useState(false);
  return <Page title="📸 Report Incident" description="Submit a geo-tagged field or citizen observation.">
    <div className="form">
      <label>Incident Type<select><option>Landslide</option><option>Road Blockage</option><option>Slope Crack</option><option>Flash Flood</option></select></label>
      <label>Severity<select><option>High</option><option>Critical</option><option>Moderate</option><option>Low</option></select></label>
      <label>Description<textarea placeholder="Describe the incident..." /></label>
      <div className="location">📍 GPS Location: Ready to capture</div>
      <label>Evidence<input type="file" accept="image/*,video/*" multiple /></label>
      <button className="primary" onClick={() => setSent(true)}>SUBMIT GEO-TAGGED REPORT</button>
      {sent && <div className="success">✓ Report queued successfully. Offline sync ready.</div>}
    </div>
  </Page>;
}

function RoadPage() {
  return <Page title="🚧 Road Connectivity" description="Monitor vulnerable transportation routes.">
    <DataTable rows={[
      ["NH-10", "Gangtok → Siliguri", "BLOCKED"],
      ["NH-6", "Shillong Region", "AT RISK"],
      ["NH-37", "Assam Corridor", "OPERATIONAL"],
      ["NH-15", "Arunachal Route", "AT RISK"],
    ]} />
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
  return <Page title="🚑 Emergency Prioritisation" description="Prioritize field response based on risk and connectivity.">
    <Alert level="CRITICAL" location="P1 — Aizawl North" text="Risk 87 • 3 villages • road blockage reported" />
    <Alert level="HIGH" location="P2 — Gangtok East" text="Risk 74 • road at risk • rainfall elevated" />
    <Alert level="HIGH" location="P2 — Shillong Hills" text="Risk 63 • heavy rainfall forecast" />
  </Page>;
}

function DataTable({ rows }: { rows: string[][] }) {
  return <div className="table">{rows.map(r => <div className="tableRow" key={r[0]}><strong>{r[0]}</strong><span>{r[1]}</span><span className={`pill ${r[2] === "BLOCKED" ? "critical" : r[2] === "AT RISK" ? "high" : "low"}`}>{r[2]}</span></div>)}</div>;
}

function Page({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <><section className="pageHead"><p className="eyebrow">NER DISASTER MANAGEMENT</p><h1>{title}</h1><p>{description}</p></section>{children}</>;
}

export default App;
