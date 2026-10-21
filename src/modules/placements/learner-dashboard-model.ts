import { isCareerRoundVisible } from "./learner-round-visibility-policy";
import {learnerExpiringOffer} from "./learner-dashboard-offer-priority-model";
import {learnerDashboardIstWeekDays} from "./learner-dashboard-ist-week-model";

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

export function learnerPlacementDashboard(
  input: {
    jobs: readonly PlacementDashboardJob[];
    applications: readonly PlacementDashboardApplication[];
    rounds: readonly PlacementDashboardRound[];
    offers: readonly PlacementDashboardOffer[];
    /** Registration is authoritative at caller boundary, not inferred from jobs. */
    registrationRequired?:boolean;
    placed?:boolean;
    optedOut?:boolean;
    /** Pending move requests cannot produce a second Confirm todo. */
    pendingRescheduleRoundIds?:readonly string[];
  },
  now: Date = new Date(),
) {
  const nowMs = now.getTime();
  const openJobIds = new Set(
    input.jobs.filter((row) => !row.deadlinePassed).map((row) => row.jobId),
  );
  const roleAccessByJob=new Map<string,boolean>();
  for(const row of input.jobs){
    if(row.deadlinePassed)continue;
    roleAccessByJob.set(row.jobId,(roleAccessByJob.get(row.jobId)??false)||row.canApply);
  }
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

  const weekDays=learnerDashboardIstWeekDays(events,now);
  const weekEvents=weekDays.flatMap(day=>day.events);
  // The timeline is already in effective-schedule order; grouping by round
  // kind here hid earlier interviews behind later assessments.
  const pendingRescheduleIds=new Set(input.pendingRescheduleRoundIds??[]);
  const attentionEvents=weekEvents.filter(event=>
    (event.kind==="ASSESSMENT"||event.kind==="INTERVIEW") &&
    !pendingRescheduleIds.has(event.roundId));
  // Do not hide an earlier interview behind a later assessment.
  const priority = events[0] ?? null;

  const urgentOffer=learnerExpiringOffer(input.offers,nowMs);
  const pendingOffers=input.offers.filter(offer=>
    (offer.status==="ISSUED"||offer.status==="RELEASED")&&
    (offer.expiresAt===null||(Number.isFinite(offer.expiresAt.getTime())&&
      offer.expiresAt.getTime()>nowMs)));
  const nextAction=urgentOffer
    ? {
        label:"Offer decision due soon",
        title:"Review your expiring placement offer",
        detail:"An issued offer expires within 24 hours. Review the official terms before responding.",
        href:"/learn/my-placements/offers?status=pending",
        when:urgentOffer.expiresAt,
      }
    : pendingOffers.length > 0
    ? {
        label:"You have an offer",
        title:"Reply to your placement offer",
        detail:"Review the offer terms and deadline before responding.",
        href:"/learn/my-placements/offers?status=pending",
        when:null,
      }
    : input.registrationRequired
    ? {
        label:"Registration needed",
        title:"Register for placements",
        detail:"Complete the placement registration step before applying to new drives.",
        href:"/learn/my-placements/placement",
        when:null,
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
    : input.placed
    ? {
        label:"Placed",
        title:"Your placement is recorded",
        detail:"Review your official offer and joining details.",
        href:"/learn/my-placements/offers",
        when:null,
      }
    : openJobIds.size>0
    ? {
        label: appliedIds.size===0?"Start here":"Stay ready",
        title: appliedIds.size===0?"Explore placement opportunities":"Browse more opportunities",
        detail:"Check published roles and their eligibility before applying.",
        href:"/learn/my-placements/jobs",
        when:null,
      }
    : input.optedOut
    ? {
        label:"Participation paused",
        title:"You opted out of placements",
        detail:"Review your college's placement participation choices.",
        href:"/learn/my-placements/placement",
        when:null,
      }
    : {
        label:"All caught up",
        title:"You're up to date",
        detail:"New opportunities and scheduled rounds will appear here.",
        href:"/learn/my-placements",
        when:null,
      };

  return {
    applicationCount: appliedIds.size,
    openJobCount: openJobIds.size,
    notOpenToApplyJobCount:[...roleAccessByJob.values()].filter(canApply=>!canApply).length,
    eligibleToApplyCount: new Set(
      input.jobs.filter((row) => !row.deadlinePassed && row.canApply)
        .map((row) => row.jobId),
    ).size,
    upcomingAssessmentCount: events.filter((event) => event.kind === "ASSESSMENT").length,
    thisWeekAssessmentCount:weekEvents.filter(event=>event.kind==="ASSESSMENT").length,
    upcomingInterviewCount: events.filter((event) => event.kind === "INTERVIEW").length,
    thisWeekInterviewCount:weekEvents.filter(event=>event.kind==="INTERVIEW").length,
    activeOfferCount: pendingOffers.length,
    activeApplicationCount: new Set(
      input.applications.filter((row) =>
        row.applicationStatus === "SUBMITTED" &&
        row.screeningStatus !== "REJECTED",
      ).map((row) => row.applicationId),
    ).size,
    firstRun: appliedIds.size === 0,
    nextAction,
    needsAttention:attentionEvents.slice(0,3),
    urgentAssessment:attentionEvents.find(event=>event.kind==="ASSESSMENT")??null,
    urgentInterview:attentionEvents.find(event=>event.kind==="INTERVIEW")??null,
    nextScheduledEvent:events[0]??null,
    fullAttentionCount:attentionEvents.length,
    weekEvents: weekEvents.slice(0, 7),
    weekDays: weekDays.map(day=>({...day,events:day.events.slice(0,2)})),
    fullWeekEventCount: weekEvents.length,
  };
}
