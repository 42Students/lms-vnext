import { Tag } from "antd";

// Archived is the normal end of a group's life, not an error.
export const STATUS_COLOR = { DRAFT: "default", ACTIVE: "green", CLOSED: "orange", ARCHIVED: "default" };
export const statusLabel = (s) => (s ? String(s).charAt(0) + String(s).slice(1).toLowerCase() : "");
export const STATE_COLOR = { ACTIVE: "green", WAITLISTED: "gold", REQUESTED: "blue", REMOVED: "default" };
export const SOURCE_LABEL = { MANUAL: "Added by admin", CSV: "Imported", RULE: "Matched rule", SELF: "Joined" };

export const StatusTag = ({ status }) => <Tag color={STATUS_COLOR[status] || "default"}>{statusLabel(status)}</Tag>;
export const StateTag = ({ state }) => <Tag color={STATE_COLOR[state] || "default"}>{statusLabel(state)}</Tag>;

export const seatsText = (g) => {
  if (g.capacity == null) return `${g.activeCount ?? 0} · unlimited`;
  return `${g.activeCount ?? 0} / ${g.capacity}`;
};

/** Backend LocalDateTime arrives either as an ISO string or as Jackson's array form [y, M, d, h, m, s, nanos]. */
export const toDate = (v) => {
  if (!v) return null;
  if (Array.isArray(v)) {
    const [y, M = 1, d = 1, h = 0, m = 0, s = 0] = v;
    return new Date(y, M - 1, d, h, m, s);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const fmt = (v) => {
  const d = toDate(v);
  return d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
};
