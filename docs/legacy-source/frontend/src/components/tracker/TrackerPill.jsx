import { severityLabel, statusLabel } from "@/data/bugTrackerData";

export function StatusPill({ value }) {
  return <span className={`tracker-pill tracker-pill--status tracker-pill--${String(value || "").toLowerCase()}`}>{statusLabel(value)}</span>;
}

export function SeverityPill({ value }) {
  return <span className={`tracker-pill tracker-pill--severity tracker-pill--severity-${String(value || "").toLowerCase()}`}>{severityLabel(value)}</span>;
}
