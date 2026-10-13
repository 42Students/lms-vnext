import { isCareerRoundVisible } from "./learner-round-visibility-policy";

/** A scheduled round is not evidence of test submission or interview completion. */
export type LearnerRoundBrowseSource = {
  applicationId: string;
  roundId: string;
  roundKind: string;
  roundName: string;
  companyName: string;
  roleTitle: string;
  scheduledAt: string | null;
  exception: { scheduledAt: string } | null;
};

export type LearnerRoundTimeBucket = "all" | "upcoming" | "past" | "unscheduled";
export type LearnerRoundBrowseFilters = {
  search: string;
  time: LearnerRoundTimeBucket;
  urgency: "all" | "today" | "week";
  sort: "soonest" | "latest" | "company";
};

export function learnerRoundScheduledInstant(
  round: LearnerRoundBrowseSource,
): number | null {
  const raw = round.exception?.scheduledAt ?? round.scheduledAt;
  if (!raw) return null;
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function localIndiaDate(time: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(time));
}

export function learnerRoundUrgency(
  round: LearnerRoundBrowseSource, nowMs: number,
): "today" | "week" | "later" | "past" | "unscheduled" {
  const due = learnerRoundScheduledInstant(round);
  if (due === null) return "unscheduled";
  if (due < nowMs) return "past";
  if (localIndiaDate(due) === localIndiaDate(nowMs)) return "today";
  if (due < nowMs + 7 * 24 * 60 * 60 * 1000) return "week";
  return "later";
}

export function browseLearnerCareerRounds<T extends LearnerRoundBrowseSource>(
  rounds: readonly T[],
  kind: "ASSESSMENT" | "INTERVIEW" | "CALENDAR",
  filters: LearnerRoundBrowseFilters,
  nowMs: number,
): T[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return rounds.filter((round) => {
    if (!isCareerRoundVisible(kind, round.roundKind)) return false;
    if (search && ![
      round.companyName, round.roleTitle, round.roundName,
    ].join(" ").toLocaleLowerCase().includes(search)) return false;
    const due = learnerRoundScheduledInstant(round);
    if (filters.time === "unscheduled" && due !== null) return false;
    if (filters.time === "upcoming" && (due === null || due < nowMs)) return false;
    if (filters.time === "past" && (due === null || due >= nowMs)) return false;
    const urgency = learnerRoundUrgency(round, nowMs);
    if (filters.urgency === "today" && urgency !== "today") return false;
    if (filters.urgency === "week" && urgency !== "today" && urgency !== "week") return false;
    return true;
  }).sort((a,b) => {
    if (filters.sort === "company") {
      return a.companyName.localeCompare(b.companyName) ||
        a.roundName.localeCompare(b.roundName) ||
        a.roundId.localeCompare(b.roundId);
    }
    const left = learnerRoundScheduledInstant(a) ?? Number.MAX_SAFE_INTEGER;
    const right = learnerRoundScheduledInstant(b) ?? Number.MAX_SAFE_INTEGER;
    const cmp = filters.sort === "latest" ? right-left : left-right;
    return cmp || a.applicationId.localeCompare(b.applicationId) ||
      a.roundId.localeCompare(b.roundId);
  });
}
