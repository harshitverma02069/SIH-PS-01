const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function getRiskZones() {
  const response = await fetch(`${API_BASE_URL}/api/risk-zones`);

  if (!response.ok) {
    throw new Error("Failed to fetch risk zones");
  }

  return response.json();
}

export async function getAlerts() {
  const response = await fetch(`${API_BASE_URL}/api/alerts`);

  if (!response.ok) {
    throw new Error("Failed to fetch alerts");
  }

  return response.json();
}

export async function getWeather() {
  const response = await fetch(`${API_BASE_URL}/api/weather`);

  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  return response.json();
}

export async function getRoads() {
  const response = await fetch(`${API_BASE_URL}/api/roads/status`);

  if (!response.ok) {
    throw new Error("Failed to fetch road status");
  }

  return response.json();
}
