import { dj } from "@/components/tpo/dj";

const INVITE = { NOT_SENT: "No invite sent", SENT: "Invite sent, not opened", CLICKED: "Opened the invite, not joined yet", JOINED: "Joined", BOUNCED: "Invite bounced" };

/** "2 days ago", "just now", or null when the value is missing or not a date. */
export function agoText(value, now = new Date()) {
  if (!value) return null;
  const d = dj(value);
  if (!d.isValid()) return null;
  const mins = Math.max(0, Math.round((now.getTime() - d.valueOf()) / 60000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 45) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.format("D MMM YYYY");
}

/**
 * What the placement cell reads about a recruiter: where the invite stands, and once they have joined,
 * whether and when they last signed in. "Joined, has not signed in yet" is the one worth a nudge.
 */
export function recruiterActivity(recruiterLead, now = new Date()) {
  const status = recruiterLead?.inviteStatus;
  const base = INVITE[status] || "";
  if (status !== "JOINED") return { text: base, tone: status === "BOUNCED" ? "bad" : "neutral" };
  const ago = agoText(recruiterLead?.recruiterLastLoginAt, now);
  return ago ? { text: `Joined · signed in ${ago}`, tone: "good" } : { text: "Joined · has not signed in yet", tone: "warn" };
}
