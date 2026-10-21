import { z } from "zod";
import { COLLEGE_SETUP_DEEP_LINKS } from "./college-setup-checklist-model";

export const collegeDashboardCardsQuerySchema = z.strictObject({});

export const COLLEGE_DASHBOARD_CARD_DEFINITIONS = [
  { key: "students", label: "Students", description: "Active LEARNER roles; not enrolled headcount" },
  { key: "faculty", label: "Faculty", description: "Active FACULTY roles; not classroom availability" },
  { key: "course-list", label: "Courses", description: "College-owned active courses, not active deliveries" },
  { key: "batches", label: "Non-archived batches", description: "Planned, active or completed cohorts" },
  { key: "classes", label: "Active classes", description: "Sections with an active status" },
  { key: "faculty-assignment", label: "Active teaching assignments", description: "Assignment rows, not teaching hours" },
  { key: "lecture-halls", label: "Active lecture halls", description: "Active hall records, not available rooms" },
  { key: "jobs", label: "Active drives", description: "Non-archived published jobs" },
] as const;

/** Legacy AtAGlance.js: exactly four stats in this order under the heading below. */
export const COLLEGE_AT_A_GLANCE_HEADING = "At a glance";
/** Four old LMS card glyphs, drawn as inline SVG; no icon package. */
export const COLLEGE_AT_A_GLANCE_ICONS:Readonly<Record<string,string>>={
 students:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
 faculty:"M7 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM1 21a6 6 0 0 1 12 0M17 5a4 4 0 0 1 0 8m-2 3a6 6 0 0 1 8 5",
 "course-list":"M4 3h15v17H6a2 2 0 0 1-2-2V3Zm0 14c0-1 1-2 2-2h13M8 7h7M8 11h7",
 jobs:"M4 7h16v14H4zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13a22 22 0 0 0 16 0",
};
export const COLLEGE_AT_A_GLANCE_CARD_CLASS="h-full min-h-[100px] px-4 py-3";
export const COLLEGE_AT_A_GLANCE_KEYS = ["students", "faculty", "course-list", "jobs"] as const;

type DashboardCountKey = (typeof COLLEGE_DASHBOARD_CARD_DEFINITIONS)[number]["key"];

/** These are inspection suggestions, not errors, launch blockers, or completion scores. */
export function collegeDashboardEmptyRecordPrompts(
  cards: readonly { key: DashboardCountKey; label: string; count: number | null; href: string }[],
) {
  return cards.filter(card => card.count === 0).map(card => ({
    key: card.key, label: card.label, href: card.href,
    hint: "No matching active records. Review this directory if you expected entries.",
  }));
}


export function collegeDashboardCardsProjection(
  counts: Readonly<Partial<Record<DashboardCountKey, number | null>>>,
) {
  return COLLEGE_DASHBOARD_CARD_DEFINITIONS.map(def => {
    const value = counts[def.key];
    if (value !== undefined && value !== null &&
      (!Number.isSafeInteger(value) || value < 0)) {
      throw new Error("DASHBOARD_COUNT_INVALID:" + def.key);
    }
    const href = COLLEGE_SETUP_DEEP_LINKS[def.key];
    if (!href || !href.startsWith("/college/")) {
      throw new Error("DASHBOARD_LINK_UNAVAILABLE:" + def.key);
    }
    return {
      ...def,
      count: value ?? null,
      href,
    };
  });
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"] as const;

/** Legacy header date, moment format `dddd, D MMMM YYYY` (for example `Friday, 16 October 2026`). */
export function formatCollegeHeaderDate(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
