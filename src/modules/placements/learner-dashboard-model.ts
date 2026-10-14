import { isCareerRoundVisible } from "./learner-round-visibility-policy";
import {learnerExpiringOffer} from "./learner-dashboard-offer-priority-model";

/** Use only learner-scoped source rows; never infer employer outcomes or
 * "confirmed" attendance from a scheduled round. Dates are UTC instants. */
export type PlacementDashboardRound = {
  applicationId: string;
  roundId: string;
  roundKind: string;
  roundName: string;
  companyName: string;
  roleTitle: string;
  scheduledAt: Date | null;
  exception: { scheduledAt: Date } | null;
};

export type PlacementDashboardJob = {
  jobId: string;
  deadlinePassed: boolean;
  canApply: boolean;
};

export type PlacementDashboardApplication = {
  applicationId: string;
  applicationStatus: string;
  screeningStatus: string;
};

export type PlacementDashboardOffer = {
  status: string;
  expiresAt: Date | null;
};

export type PlacementDashboardEvent = {
  applicationId: string;
  roundId: string;
  roundName: string;
  companyName: string;
  roleTitle: string;
  kind: "ASSESSMENT" | "INTERVIEW" | "OTHER";
  when: Date;
  rescheduled: boolean;
  href: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function learnerPlacementDashboard(
  input: {
    jobs: readonly PlacementDashboardJob[];
    applications: readonly PlacementDashboardApplication[];
    rounds: readonly PlacementDashboardRound[];
    offers: readonly PlacementDashboardOffer[];
  },
  now: Date = new Date(),
) {
  const nowMs = now.getTime();
  const weekEndMs = nowMs + WEEK_MS;
  const openJobIds = new Set(
    input.jobs.filter((row) => !row.deadlinePassed).map((row) => row.jobId),
  );
  const appliedIds = new Set(input.applications.map((row) => row.applicationId));
  const events: PlacementDashboardEvent[] = input.rounds.flatMap((row) => {
    const effective = row.exception?.scheduledAt ?? row.scheduledAt;
    const whenMs = effective?.getTime() ?? Number.NaN;
    if (!Number.isFinite(whenMs) || whenMs < nowMs) return [];
    const kind: PlacementDashboardEvent["kind"] = isCareerRoundVisible("ASSESSMENT", row.roundKind)
      ? "ASSESSMENT"
      : isCareerRoundVisible("INTERVIEW", row.roundKind) ? "INTERVIEW" : "OTHER";
    const exactQuery = "?applicationId=" +
      encodeURIComponent(row.applicationId) +
      "&roundId=" + encodeURIComponent(row.roundId);
    const href = kind === "ASSESSMENT"
      ? "/learn/my-placements/assessments" + exactQuery
      : kind === "INTERVIEW"
        ? "/learn/my-placements/interviews" + exactQuery
        : "/learn/my-placements/calendar";
    return [{
      applicationId: row.applicationId,
      roundId: row.roundId,
      roundName: row.roundName,
      companyName: row.companyName,
      roleTitle: row.roleTitle,
      kind,
      when: new Date(whenMs),
      rescheduled: row.exception !== null,
      href,
    }];
  }).sort((a, b) => a.when.getTime() - b.when.getTime() ||
    a.applicationId.localeCompare(b.applicationId) ||
    a.roundId.localeCompare(b.roundId));

  const weekEvents = events.filter((event) => event.when.getTime() <= weekEndMs);
  // The timeline is already in effective-schedule order; grouping by round
  // kind here hid earlier interviews behind later assessments.
  const attentionEvents=weekEvents.filter(event=>
    event.kind==="ASSESSMENT"||event.kind==="INTERVIEW");
  const firstWeek = (kind: PlacementDashboardEvent["kind"]) =>
    weekEvents.find((event) => event.kind === kind) ?? null;
  const priority =
    firstWeek("ASSESSMENT") ??
    firstWeek("INTERVIEW") ??
    events[0] ??
    null;

  const urgentOffer=learnerExpiringOffer(input.offers,nowMs);
  const nextAction=urgentOffer
    ? {
        label:"Offer decision due soon",
        title:"Review your expiring placement offer",
        detail:"An issued offer expires within 24 hours. Review the official terms before responding.",
        href:"/learn/my-placements/offers?status=pending",
        when:urgentOffer.expiresAt,
      }
    : priority
    ? {
        label: priority.kind === "ASSESSMENT"
          ? "Assessment coming up"
          : priority.kind === "INTERVIEW"
            ? "Interview coming up" : "Next scheduled event",
        title: priority.roundName,
        detail: `${priority.companyName} · ${priority.roleTitle}`,
        href: priority.href,
        when: priority.when,
      }
    : {
        label: appliedIds.size === 0 ? "Start here" : "Stay ready",
        title: appliedIds.size === 0
          ? "Explore placement opportunities"
          : "Browse more opportunities",
        detail: "Check published roles and their eligibility before applying.",
        href: "/learn/my-placements/jobs",
        when: null,
      };

  return {
    applicationCount: appliedIds.size,
    openJobCount: openJobIds.size,
    eligibleToApplyCount: new Set(
      input.jobs.filter((row) => !row.deadlinePassed && row.canApply)
        .map((row) => row.jobId),
    ).size,
    upcomingAssessmentCount: events.filter((event) => event.kind === "ASSESSMENT").length,
    upcomingInterviewCount: events.filter((event) => event.kind === "INTERVIEW").length,
    activeOfferCount: input.offers.filter((row) => row.status === "ISSUED" &&
      (row.expiresAt===null||row.expiresAt.getTime()>=nowMs)).length,
    activeApplicationCount: new Set(
      input.applications.filter((row) =>
        row.applicationStatus === "SUBMITTED" &&
        row.screeningStatus !== "REJECTED",
      ).map((row) => row.applicationId),
    ).size,
    firstRun: appliedIds.size === 0,
    nextAction,
    needsAttention:attentionEvents.slice(0,3),
    fullAttentionCount:attentionEvents.length,
    weekEvents: weekEvents.slice(0, 7),
    fullWeekEventCount: weekEvents.length,
  };
}
