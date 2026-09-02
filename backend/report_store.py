import json
from pathlib import Path

REPORTS_FILE = Path("reports.json")


def load_reports():
    if not REPORTS_FILE.exists():
        return []

    try:
        return json.loads(REPORTS_FILE.read_text())
    except (json.JSONDecodeError, OSError):
        return []


def save_report(report):
    reports = load_reports()
    reports.append(report)
    REPORTS_FILE.write_text(json.dumps(reports, indent=2))


def get_reports():
    return load_reports()
