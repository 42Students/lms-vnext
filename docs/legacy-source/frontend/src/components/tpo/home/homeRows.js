// TPO Home, the least to read (user, 5 Oct 2026): a greeting, one "Next up" card with one button, then seven quiet rows (icon,
// name, a few words of status). A row that needs the placement cell gets a small dot. Built only from GET /tpo/home.
import { dj } from "@/components/tpo/dj";

const n = (v) => Number(v) || 0;
const count = (k, one, many = `${one}s`) => `${k.toLocaleString()} ${k === 1 ? one : many}`;
const ofType = (cards, type) => cards.filter((c) => c && typeof c === "object" && c.type === type);
const total = (cards, type) => ofType(cards, type).reduce((t, c) => t + (n(c.count) || 1), 0);

/** "Good morning" / "Good afternoon" / "Good evening" for the hour (0-23). */
export function greeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// What the one button on the Next up card says, per kind of task.
const ACTION = {
  DRIVE_REQUESTS: "Review requests", RECRUITER_ACCESS: "Review recruiters", SHARE_APPLICANTS: "Share applicants", DEADLINE_TODAY: "Remind students",
  SLOTS_TO_CONFIRM: "Confirm slots", RESULTS_READY: "Apply results", SELECTIONS_TO_VERIFY: "Verify selections", REQUESTS: "Decide requests",
  RECRUITER_MESSAGES: "Reply", FOLLOW_UPS: "See follow-ups", NO_DEADLINE: "Set a deadline", CLOSING_SOON: "Remind students",
  TEAM_ASKS: "See what you were asked",
};

/**
 * The single most important thing to do now: { title, text, action, href } or null when nothing waits.
 * The server already orders its to-do list by urgency (priority 0 first); inviting a batch is said in full.
 */
export function nextUp(data) {
  const d = data || {};
  const cards = (Array.isArray(d.needsYou) ? d.needsYou.filter((item) => item && typeof item === "object") : []).slice().sort((a, b) => n(a.priority) - n(b.priority));
  const top = cards[0];
  if (top) {
    if (top.type === "REGISTRATION_CLOSED") {
      const b = (Array.isArray(d.batches) ? d.batches : []).find((x) => x && typeof x === "object" && !x.invitedAt);
      const eligible = b ? n(b.eligible) : n(top.count);
      // Inviting tells only the eligible students who have not chosen yet (BatchRegistrationService.invite).
      const toTell = b ? Math.max(0, eligible - n(b.registered)) : eligible;
      return {
        title: b ? `Invite the ${b.name} to register` : top.title,
        text: `${count(toTell, "eligible student hasn't", "eligible students haven't")} registered; they can't until you invite the batch.`,
        action: `Invite ${count(toTell, "student")}`,
        href: b ? `/tpo/batches/${b.batchId}` : top.link,
      };
    }
    const more = cards.length - 1;
    return { title: top.title, text: more > 0 ? `Then ${count(more, "more thing")} after this.` : "That is the only thing waiting.", action: ACTION[top.type] || "Open", href: top.link };
  }
  const steps = (Array.isArray(d.checklist) ? d.checklist : []).filter((s) => s && typeof s === "object" && !s.done);
  if (steps.length) {
    return { title: steps[0].label, text: `Setting up placements: ${count(steps.length, "step")} left.`, action: "Start", href: steps[0].link || "/tpo/batches" };
  }
  return null;
}

/** "Tue 10 AM" for a calendar item time (a date-time array or string from the server, read as UTC). */
const when = (t) => {
  const d = dj(t);
  if (!d.isValid()) return "";
  const day = d.isSame(dj(), "day") ? "Today" : d.isSame(dj().add(1, "day"), "day") ? "Tomorrow" : d.format("ddd");
  return `${day} ${d.format(d.minute() ? "h:mm A" : "h A")}`;
};

/** The seven rows, in order (Team added by Team module V1): { key, title, status, href, attention, icon } */
export function homeRows(data) {
  const d = data || {};
  const cards = Array.isArray(d.needsYou) ? d.needsYou.filter((item) => item && typeof item === "object") : [];
  const numbers = d.numbers || {};

  const batches = Array.isArray(d.batches) ? d.batches.filter((item) => item && typeof item === "object") : [];
  const b = batches[0];
  const batchStatus = b ? `${b.name} · ${n(b.registered)} of ${n(b.eligible)} registered, ${n(b.placed)} placed${batches.length > 1 ? ` · +${batches.length - 1} more` : ""}` : "No batch in placements yet";

  const live = n(numbers.liveDrives);
  const driveBits = [
    total(cards, "DRIVE_REQUESTS") && count(total(cards, "DRIVE_REQUESTS"), "request"),
    ofType(cards, "RESULTS_READY").length && "results waiting",
    ofType(cards, "SELECTIONS_TO_VERIFY").length && "selections to verify",
    ofType(cards, "DEADLINE_TODAY").length && "deadline today",
    ofType(cards, "NO_DEADLINE").length && `${ofType(cards, "NO_DEADLINE").length} ${ofType(cards, "NO_DEADLINE").length === 1 ? "has" : "have"} no deadline`,
    ofType(cards, "CLOSING_SOON").length && `${ofType(cards, "CLOSING_SOON").length} closing soon`,
  ].filter(Boolean);
  const driveNeeds = cards.some((c) => ["DRIVE_REQUESTS", "RESULTS_READY", "SELECTIONS_TO_VERIFY", "DEADLINE_TODAY", "NO_DEADLINE", "CLOSING_SOON", "SHARE_APPLICANTS", "SLOTS_TO_CONFIRM"].includes(c.type));

  const due = Array.isArray(d.followUps) ? d.followUps.length : 0;
  const recruiters = total(cards, "RECRUITER_ACCESS");
  const requests = total(cards, "REQUESTS");
  const messages = total(cards, "RECRUITER_MESSAGES");
  const week = Array.isArray(d.thisWeek) ? d.thisWeek.filter((item) => item && typeof item === "object") : [];
  const next = week[0];

  return [
    { key: "batches", icon: "batches", title: "Placement eligibility", status: batchStatus, href: "/tpo/batches", attention: !b || batches.some((x) => !x.invitedAt) },
    { key: "drives", icon: "drives", title: "Drives", status: [live ? `${live} live` : "No live drives", ...driveBits.slice(0, 1)].join(" · "),
      href: total(cards, "DRIVE_REQUESTS") ? "/tpo/drives?tab=requests" : "/tpo/drives", attention: driveNeeds },
    { key: "students", icon: "students", title: "Students", status: n(numbers.registered) ? `${n(numbers.registered)} registered · ${n(numbers.placedUnique)} placed` : "Nobody registered yet", href: "/tpo/students", attention: false },
    { key: "engage", icon: "engage", title: "Engage",
      status: [count(n(d.companyFunnel?.recruiterLeads), "recruiter"), due ? `${count(due, "follow-up")} today` : "no follow-ups today", recruiters ? `${count(recruiters, "new account")} to approve` : null].filter(Boolean).join(" · "),
      href: due ? "/tpo/recruiters?due=1" : recruiters ? "/tpo/settings?tab=recruiters" : "/tpo/recruiters", attention: due > 0 || recruiters > 0 },
    { key: "inbox", icon: "inbox", title: "Inbox",
      status: requests || messages ? [requests && count(requests, "request"), messages && `${count(messages, "message")} to answer`].filter(Boolean).join(" · ") : "No requests or messages waiting",
      href: requests ? "/tpo/requests" : "/tpo/messages", attention: requests + messages > 0 },
    teamRow(d.team),
    { key: "week", icon: "week", title: "This week", status: next ? `${when(next.startsAt)} · ${next.title}${week.length > 1 ? ` · +${week.length - 1} more` : ""}` : "Nothing on the calendar", href: "/tpo/calendar", attention: false },
  ];
}

/** Team (Team module V1): asks on you, overdue first, and mentions you haven't seen; it needs you when either is waiting. */
export function teamRow(team) {
  const t = team || {};
  const asks = n(t.asksOpen);
  const overdue = n(t.asksOverdue);
  const mentions = n(t.mentionsNew);
  const unread = n(t.unread);
  const bits = [
    asks && `${count(asks, "ask")} for you${overdue ? ` (${overdue} overdue)` : ""}`,
    mentions && count(mentions, "mention"),
    !asks && !mentions && unread && `${count(unread, "new message")}`,
  ].filter(Boolean);
  return {
    key: "team", icon: "team", title: "Team", status: bits.length ? bits.join(" · ") : "Nothing waiting on you",
    href: asks || mentions ? "/tpo/messages?tab=team&filter=me" : "/tpo/messages?tab=team", attention: asks + mentions > 0,
  };
}

/**
 * "Two things need you today." / "You're all caught up." It counts the same to-do items as Next up ("Then 4 more things after
 * this"), not the rows: one row can hold several (Drives), and the line said "Four things" above five (test run, 15 Oct 2026).
 * It never says fewer than the rows with a dot (a college with no batch yet has a dot but no to-do item), so it never reads
 * "all caught up" above a "Needs you".
 */
export function needLine(rows, data) {
  const cards = Array.isArray(data?.needsYou) ? data.needsYou.filter((item) => item && typeof item === "object") : [];
  const k = Math.max(cards.length, rows.filter((r) => r.attention).length);
  const words = ["", "One thing needs", "Two things need", "Three things need", "Four things need", "Five things need", "Six things need", "Seven things need"];
  return k ? `${words[k] || `${k} things need`} you today.` : "You're all caught up.";
}
