// Pure rules for the students list "Journey" column and its filters: who got until where, for which company.

export const REACHED_OPTIONS = [
  { value: 1, label: "Shortlisted or further" },
  { value: 2, label: "Test or further" },
  { value: 3, label: "Interview or further" },
  { value: 4, label: "Final round" },
  { value: 5, label: "Offer" },
];

export const OUTCOME_OPTIONS = [
  { value: "NOT_SELECTED", label: "Not selected" },
  { value: "CLEARED", label: "Cleared a round" },
  { value: "IN_PROGRESS", label: "Still in a round" },
  { value: "WAITLISTED", label: "Waitlisted" },
  { value: "OFFERED", label: "Offered or placed" },
  { value: "WITHDRAWN", label: "Withdrew" },
];

export const EMPTY_JOURNEY_FILTERS = { company: null, minDepth: null, outcome: null };

const journeyOf = (s) => (Array.isArray(s?.journey) ? s.journey : []);
const outcomeMatches = (entry, wanted) => (wanted === "OFFERED" ? entry.outcome === "OFFERED" || entry.outcome === "PLACED" : entry.outcome === wanted);

/** Distinct company names across the list, for the company picker. */
export function companiesOf(rows) {
  const set = new Set();
  (rows || []).forEach((s) => journeyOf(s).forEach((e) => { if (e.company) set.add(e.company); }));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * A student matches when ONE of their drives satisfies every condition that is switched on, so
 * "Infosys + interview or further" means the interview was at Infosys, not somewhere else.
 */
export function filterByJourney(rows, f = {}) {
  const on = Boolean(f.company) || f.minDepth != null || Boolean(f.outcome);
  if (!on) return rows || [];
  return (rows || []).filter((s) => journeyOf(s).some((e) => (
    (!f.company || e.company === f.company)
    && (f.minDepth == null || Number(e.depth) >= Number(f.minDepth))
    && (!f.outcome || outcomeMatches(e, f.outcome))
  )));
}

export function journeyFilterCount(f = {}) {
  return (f.company ? 1 : 0) + (f.minDepth != null ? 1 : 0) + (f.outcome ? 1 : 0);
}

/** The words in the cell: "Infosys: Not selected at Technical interview". */
export function bestText(s) {
  const b = s?.best;
  if (!b) return "";
  return `${b.company || "A drive"}: ${b.label}`;
}

/** antd tag colour for a journey outcome. */
export function outcomeColor(outcome) {
  switch (outcome) {
    case "PLACED": case "OFFERED": return "green";
    case "CLEARED": case "IN_PROGRESS": return "blue";
    case "WAITLISTED": return "gold";
    case "NOT_SELECTED": return "red";
    default: return "default";
  }
}

/** Sort key: furthest first, then the ones with any history, then nobody. */
export const bestDepth = (s) => (s?.best ? Number(s.best.depth) + 1 : 0);

/** Add-to-drive preview: how a list of students splits before anything is sent. */
export function splitForAdd(selected, jobId) {
  const onThis = [];
  const rest = [];
  (selected || []).forEach((s) => (journeyOf(s).some((e) => Number(e.jobId) === Number(jobId)) ? onThis : rest).push(s));
  return { alreadyOn: onThis, canTry: rest };
}
