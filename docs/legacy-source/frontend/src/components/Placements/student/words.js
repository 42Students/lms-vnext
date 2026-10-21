import moment from "moment";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

/**
 * Words and times for the student placement pages (redesign, 14 Oct 2026). Round and drive times are stored in UTC; a student
 * reads them in their own time ("Thu 15 Oct, 10:00 AM").
 */
export const at = (raw) => parsePlacementUtcDateTime(raw);

export function dayTime(raw, { withDay = true } = {}) {
  const m = at(raw);
  if (!m) return "";
  // A midnight round date means "this day, time to be told" (the TPO set the day only).
  const time = m.hours() === 0 && m.minutes() === 0 ? "" : `, ${m.format("h:mm A")}`;
  return `${m.format(withDay ? "ddd D MMM" : "D MMM")}${time}`;
}

export function hasTime(raw) {
  const m = at(raw);
  return Boolean(m) && !(m.hours() === 0 && m.minutes() === 0);
}

/** "Today", "Tomorrow", "In 5 days", "Yesterday", "3 days ago" by calendar day. */
export function relativeDay(raw) {
  const m = at(raw);
  if (!m) return "";
  const days = m.clone().startOf("day").diff(moment().startOf("day"), "days");
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1) return days < 7 ? `In ${days} days` : `${m.format("D MMM")}`;
  return `${-days} days ago`;
}

/** Hours left until a time: for deadlines ("Respond in 20 hours"). */
export function timeLeft(raw) {
  const m = at(raw);
  if (!m) return "";
  const mins = m.diff(moment(), "minutes");
  if (mins <= 0) return "Time is up";
  if (mins < 60) return `${mins} min left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} left`;
  return `${Math.floor(hours / 24)} days left`;
}

/**
 * A round is over once it has ended: its slot's end, else its start plus its length (an hour when unknown). A test this morning was
 * still offered as "next" with Confirm all afternoon. A round with a day but no time is over only when the day is.
 */
export function isOver(item) {
  const end = at(item?.endsAt);
  if (end) return end.isBefore(moment());
  const start = at(item?.startsAt);
  if (!start) return false;
  if (!hasTime(item.startsAt)) return start.clone().endOf("day").isBefore(moment());
  return start.clone().add(Number(item.durationMinutes) || 60, "minutes").isBefore(moment());
}

export const isPast = (raw) => {
  const m = at(raw);
  return Boolean(m) && m.isBefore(moment());
};

export const KIND = {
  TALK: "Pre-placement talk",
  TEST: "Test",
  VENDOR_TEST: "Online test",
  GD: "Group discussion",
  INTERVIEW: "Interview",
};
export const kindWord = (k) => KIND[k] || "Round";
/** The round type, only when the round's name does not already say it ("Aptitude test · Test" read twice; student UX audit, 20 Oct 2026). */
export const kindNote = (name, k) => {
  const word = kindWord(k);
  const last = word.split(" ").pop().toLowerCase();
  return String(name || "").toLowerCase().includes(last) ? null : word;
};

/** A round's state for the student, in their words. */
export const ROUND_STATE = {
  CLEARED: { label: "Cleared", tone: "good" },
  NOT_CLEARED: { label: "Not cleared", tone: "bad" },
  ABSENT: { label: "Marked absent", tone: "bad" },
  WAITLISTED: { label: "Waitlisted", tone: "wait" },
  DONE: { label: "Done", tone: "good" },
  SCHEDULED: { label: "Booked", tone: "now" },
  NEXT: { label: "Up next", tone: "now" },
  LATER: { label: "Not booked yet", tone: "later" },
  TALK: { label: "Talk", tone: "later" },
  NOT_REACHED: { label: "Not reached", tone: "off" },
};

/** Where an application stands, in one line a student understands. */
export function standing(app) {
  const s = app?.status;
  const life = app?.lifecycle;
  if (life === "CANCELLED") return { label: "Drive cancelled", tone: "off" };
  if (s === "HIRED") return { label: "Placed", tone: "good" };
  if (s === "OFFERED") {
    const o = app.offer;
    if (o?.status === "RELEASED") return { label: "Offer: reply needed", tone: "now" };
    if (o?.status === "ACCEPTED") return { label: "Offer accepted", tone: "good" };
    return { label: "Offered", tone: "good" };
  }
  if (s === "REJECTED" || s === "NOT_SELECTED") {
    const failed = (app.rounds || []).find((r) => r.state === "NOT_CLEARED" || r.state === "ABSENT");
    if (app.offer?.status === "DECLINED" || app.reason === "Offer declined by candidate") return { label: "Offer declined", tone: "off" };
    return { label: failed ? `Not cleared: ${failed.name}` : "Not selected", tone: "bad" };
  }
  if (s === "WITHDRAWN") return { label: "Withdrawn", tone: "off" };
  if (s === "WAITLISTED") return { label: "Waitlisted", tone: "wait" };
  const current = (app.rounds || []).find((r) => r.state === "SCHEDULED" || r.state === "NEXT");
  if (life === "CLOSED" && !current) return { label: "Drive closed", tone: "off" };
  if (current) return { label: `${current.state === "SCHEDULED" ? "Booked" : "Next"}: ${current.name}`, tone: "now" };
  if (s === "SHORTLISTED") return { label: "Shortlisted", tone: "now" };
  return { label: "Applied · waiting for the company", tone: "later" };
}

export const payLine = (app) => app?.pay || "";

export const errorText = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;
