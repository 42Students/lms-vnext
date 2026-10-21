/**
 * Shared job type and application status tag configs for learner job flows.
 * Used by: learn/jobs/index.js, learn/jobs/[jobId].js, learn/my-applications.js
 */

import { Tag } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { StatusBadge, STATUS_TONE } from "@/components/Common/PanelStates";

/**
 * Accepts ISO strings and Jackson array dates ([y, m, d, h, mi, s]). Backend LocalDateTime
 * values are UTC — converts to the viewer's local time.
 */
export function parseJobDate(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, mo, d, h, mi, s] = raw;
    const m = moment.utc({ year: y, month: (mo ?? 1) - 1, date: d ?? 1, hour: h ?? 0, minute: mi ?? 0, second: s ?? 0 }).local();
    return m.isValid() ? m : null;
  }
  const m = moment.utc(raw).local();
  return m.isValid() ? m : null;
}

/**
 * "Posted X ago" text, shared between the Jobs list and Job detail pages — was two separate
 * implementations with different abbreviation styles ("3d ago" vs "3 days ago") and different
 * fallback date formats ("Mar 4" vs "04 Mar 2026"), so the same job showed different posted-date
 * text depending on which page you viewed it from.
 */
export function formatPostedAgo(dateStr) {
  const m = parseJobDate(dateStr);
  if (!m) return null;
  const days = moment().diff(m, "days");
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return m.format("DD MMM YYYY");
}

/** Subtle accent colors for job card left edges — teal + amber + green palette (matches placements dashboard). */
const JOB_ACCENT_COLORS = [
  "#26bac7", "#5bc4d0", "#1e5f6b", "#059669", "#6dd9a3",
  "#d97706", "#e4b87a", "#0d9488", "#7dd3dc", "#94a3b8",
];

/**
 * Returns a subtle accent color for job card left edge. Same job ID gets same color.
 * @param {number|string} [jobId]
 * @param {number} [index] fallback when jobId missing
 */
export function getJobAccentColor(jobId, index = 0) {
  const key = jobId != null ? String(jobId) : String(index);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return JOB_ACCENT_COLORS[Math.abs(hash) % JOB_ACCENT_COLORS.length];
}

// Minimal palette: primary #2563eb, success #22c55e, warning #f59e0b, error #ef4444
const JOB_TYPE_CONFIG = {
  "full-time": { color: "blue", hex: "#2563eb", text: "Full-time" },
  "internship": { color: "green", hex: "#22c55e", text: "Internship" },
  "internship + full-time": { color: "cyan", hex: "#0891b2", text: "Internship + full-time" },
  "apprenticeship": { color: "purple", hex: "#7c3aed", text: "Apprenticeship" },
  "part-time": { color: "blue", hex: "#3b82f6", text: "Part-time" },
  "contract": { color: "orange", hex: "#f59e0b", text: "Contract" },
  "remote": { color: "green", hex: "#16a34a", text: "Remote" },
  "freelance": { color: "blue", hex: "#60a5fa", text: "Freelance" },
};

const APPLICATION_STATUS_CONFIG = {
  APPLIED: { tone: STATUS_TONE.info, icon: ClockCircleOutlined, text: "Applied" },
  SHORTLISTED: { tone: STATUS_TONE.success, icon: CheckCircleOutlined, text: "Shortlisted" },
  ASSESSMENT: { tone: STATUS_TONE.warning, icon: ClockCircleOutlined, text: "Assessment" },
  INTERVIEW: { tone: STATUS_TONE.info, icon: ClockCircleOutlined, text: "Interview" },
  OFFERED: { tone: STATUS_TONE.success, icon: CheckCircleOutlined, text: "Offered" },
  HIRED: { tone: STATUS_TONE.success, icon: CheckCircleOutlined, text: "Hired" },
  REJECTED: { tone: STATUS_TONE.error, icon: CloseCircleOutlined, text: "Rejected" },
  WITHDRAWN: { tone: STATUS_TONE.neutral, icon: CloseCircleOutlined, text: "Withdrawn" },
  // WAITLISTED intentionally included — JobApplicationStatusValidator (backend) allows
  // INTERVIEW -> WAITLISTED as a real, reachable status.
  WAITLISTED: { tone: STATUS_TONE.warning, icon: ClockCircleOutlined, text: "Waitlisted" },
  // SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED are real interview-stage statuses (see the
  // dashboard's own STATUS_CONFIG, which already carries this same fix) — were missing here,
  // so a job card for an application in one of these states rendered the raw, unstyled
  // uppercase enum string instead of a designed badge.
  SCHEDULED: { tone: STATUS_TONE.info, icon: ClockCircleOutlined, text: "Scheduled" },
  CONFIRMED: { tone: STATUS_TONE.success, icon: CheckCircleOutlined, text: "Confirmed" },
  RESCHEDULE_REQUESTED: { tone: STATUS_TONE.warning, icon: ClockCircleOutlined, text: "Reschedule requested" },
  // ON_HOLD/ONBOARDED removed: JobApplicationStatusValidator's VALID_TRANSITIONS never produces
  // either status — they were dead entries with no backend path that could ever select them.
};

/**
 * Returns the soft hex border color for a given job type.
 * @param {string} [jobType]
 * @returns {string}
 */
export function getJobTypeBorderColor(jobType) {
  const key = (jobType || "").toLowerCase();
  return (JOB_TYPE_CONFIG[key] || {}).hex || "#d9d9d9";
}

/**
 * Returns the Ant Design named color for a given job type.
 * Named colors render as subtle pastel-background tags.
 * @param {string} [jobType]
 * @returns {string}
 */
export function getJobTypeColor(jobType) {
  const key = (jobType || "").toLowerCase();
  return (JOB_TYPE_CONFIG[key] || {}).color || "default";
}

/**
 * @param {string} [jobType]
 * @returns {React.ReactNode}
 */
export function getJobTypeTag(jobType) {
  const key = (jobType || "").toLowerCase();
  const config = JOB_TYPE_CONFIG[key] || {
    color: "default",
    text: jobType || "—",
  };
  return <Tag color={config.color}>{config.text}</Tag>;
}

/**
 * Case-insensitive lookup for application status.
 * @param {string} [status]
 * @returns {React.ReactNode}
 */
/**
 * Plain-text label for an application status, for contexts that just need the word (e.g. a
 * receipt row) rather than a full colored Tag. Was previously hand-rolled per call site via
 * `status.charAt(0) + status.slice(1).toLowerCase()`, which doesn't handle underscores —
 * "RESCHEDULE_REQUESTED" became "Reschedule_requested" instead of "Reschedule requested".
 * @param {string} [status]
 * @returns {string}
 */
export function getApplicationStatusLabel(status) {
  const normalized = (status || "").toUpperCase();
  return APPLICATION_STATUS_CONFIG[normalized]?.text || status || "—";
}

export function getApplicationStatusTag(status) {
  const normalized = (status || "").toUpperCase();
  const config = APPLICATION_STATUS_CONFIG[normalized] || {
    tone: STATUS_TONE.neutral,
    icon: null,
    text: status || "—",
  };
  const Icon = config.icon;
  return (
    <StatusBadge
      status={normalized || "unknown"}
      label={config.text}
      tone={config.tone}
      icon={Icon ? <Icon /> : undefined}
    />
  );
}
