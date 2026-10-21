// Generates a minimal .ics (iCalendar) file client-side for a single interview and triggers a
// download — no interview/important-date anywhere in the module could be added to an external
// calendar before this; the learner/admin had to manually retype the details.
import moment from "moment";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

function escapeIcsText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toIcsUtc(dateInput) {
  const m = parsePlacementUtcDateTime(dateInput);
  return m ? m.clone().utc().format("YYYYMMDDTHHmmss[Z]") : null;
}

/**
 * Builds and downloads a .ics file for an interview.
 * @param {Object} opts
 * @param {string} opts.title - Event title, e.g. "Technical Interview — Acme Corp"
 * @param {string|Date} opts.startDate - Scheduled date (any format moment.utc can parse)
 * @param {number} [opts.durationMinutes=60]
 * @param {string} [opts.location] - Meeting link or venue address
 * @param {string} [opts.description]
 */
export function downloadInterviewIcs({ title, startDate, durationMinutes = 60, location, description }) {
  const dtStart = toIcsUtc(startDate);
  if (!dtStart) return false;
  const parsedStart = parsePlacementUtcDateTime(startDate);
  const dtEnd = parsedStart ? toIcsUtc(parsedStart.clone().add(durationMinutes || 60, "minutes")) : null;
  const dtStamp = toIcsUtc(moment.utc());
  const uid = `interview-${dtStart}-${Math.random().toString(36).slice(2)}@42lms`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//42LMS//Placements//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title || "Interview")}`,
  ];
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `interview-${dtStart}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
