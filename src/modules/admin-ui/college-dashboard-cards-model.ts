import { z } from "zod";
import { COLLEGE_SETUP_DEEP_LINKS } from "./college-setup-checklist-model";

export const collegeDashboardCardsQuerySchema = z.strictObject({});

export const COLLEGE_DASHBOARD_CARD_DEFINITIONS = [
  { key: "students", label: "Active student memberships", description: "Active LEARNER roles; not enrolled headcount" },
  { key: "faculty", label: "Active faculty memberships", description: "Active FACULTY roles; not classroom availability" },
  { key: "course-list", label: "Active course records", description: "College-owned active courses, not active deliveries" },
  { key: "batches", label: "Non-archived batches", description: "Planned, active or completed cohorts" },
  { key: "classes", label: "Active classes", description: "Sections with an active status" },
  { key: "faculty-assignment", label: "Active teaching assignments", description: "Assignment rows, not teaching hours" },
  { key: "lecture-halls", label: "Active lecture halls", description: "Active hall records, not available rooms" },
  { key: "jobs", label: "Published placement drives", description: "Non-archived published jobs" },
] as const;

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
