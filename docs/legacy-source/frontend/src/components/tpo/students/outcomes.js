import { createElement } from "react";
import { Tag, Tooltip } from "antd";

/**
 * After college: the final outcome NAAC and NIRF count, shared by the Students page and the student panel so both say the
 * same thing. The pill always shows the standard outcome; a college's own label ("Startup" under Entrepreneurship) and the
 * detail ("the exam, the business") are on hover and in the panel, never in place of the outcome in a row (user, 6 Oct 2026:
 * a college label like "Family business" sitting among the rows read oddly).
 */
export const REGISTRATION = { // what the placement cell can set
  PLACEMENTS: "Looking for a job", HIGHER_STUDIES: "Higher studies", ENTREPRENEURSHIP: "Entrepreneurship", COMPETITIVE_EXAMS: "Competitive exams", NOT_INTERESTED: "Not interested" };

// Three tones, each with a meaning: placed (green), on another path (purple), looking for a job (blue), not decided (grey);
// debarred stays red.
export const OUTCOME_COLOR = {
  PLACED_ON_CAMPUS: "green", PLACED_OFF_CAMPUS: "green", HIGHER_STUDIES: "purple", ENTREPRENEURSHIP: "purple", COMPETITIVE_EXAMS: "purple",
  NOT_INTERESTED: "purple", SEEKING: "blue", DEBARRED: "red", NOT_REGISTERED: "default",
};

/** Outcomes that ask what exactly (the exam, the business) when the placement cell sets them. */
export const ASKS_DETAIL = ["ENTREPRENEURSHIP", "COMPETITIVE_EXAMS"];

/** Placed and debarred are worked out from what happened, so nobody sets them by hand. */
export const WORKED_OUT = ["PLACED", "DEBARRED"];

/** The choices, with the college's own labels under their outcome: value "OUTCOME" or "OUTCOME|label". */
export const registrationOptions = (outcomeLabels) => Object.entries(REGISTRATION).flatMap(([value, label]) => [
  { value, label },
  ...(outcomeLabels || []).filter((l) => l.outcome === value).map((l) => ({ value: `${value}|${l.label}`, label: `${label}: ${l.label}` })),
]);

/** The current choice as an option value. */
export const registrationValue = (row) => (row?.registration ? (row.outcomeLabel ? `${row.registration}|${row.outcomeLabel}` : row.registration) : undefined);

/** What hovering the pill says: the college's label and the detail. */
export const outcomeNote = (row) => [row?.outcomeLabel, row?.outcomeDetail].filter(Boolean).join(": ");

/** The pill: the standard outcome, the college label and detail on hover. */
export function OutcomePill({ row, className }) {
  if (!row || !row.outcome) return null;
  const tag = createElement(Tag, { color: OUTCOME_COLOR[row.outcome] || "default", bordered: false, className }, row.outcomeName || row.outcome);
  const note = outcomeNote(row);
  return note ? createElement(Tooltip, { title: note }, tag) : tag;
}
