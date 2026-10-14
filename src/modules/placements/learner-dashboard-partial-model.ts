import type { learnerPlacementDashboard } from "./learner-dashboard-model";

export type PlacementDashboardAvailability={
  jobs:boolean;journey:boolean;rounds:boolean;offers:boolean;
  preferences:boolean;academic:boolean;
};
type DashboardSnapshot=ReturnType<typeof learnerPlacementDashboard>;
const sourceNames:Record<keyof PlacementDashboardAvailability,string>={
  jobs:"Published opportunities",
  journey:"Applications and activity",
  rounds:"Interview and assessment schedule",
  offers:"Placement offers",
  preferences:"Placement preferences",
  academic:"Academic placement evidence",
};

/** Failed reads must never be presented as a genuine zero or empty schedule. */
export function learnerDashboardPartialState(
  availability:PlacementDashboardAvailability, snapshot:DashboardSnapshot,
) {
  const failed=(Object.keys(sourceNames) as (keyof PlacementDashboardAvailability)[])
    .filter(key=>!availability[key]).map(key=>sourceNames[key]);
  return {
    failed,
    partial:failed.length>0,
    openJobs:availability.jobs?snapshot.openJobCount:null,
    notOpenToApplyJobs:availability.jobs?snapshot.notOpenToApplyJobCount:null,
    eligibleJobs:availability.jobs?snapshot.eligibleToApplyCount:null,
    applications:availability.journey?snapshot.applicationCount:null,
    activeApplications:availability.journey?snapshot.activeApplicationCount:null,
    assessments:availability.rounds?snapshot.upcomingAssessmentCount:null,
    thisWeekAssessments:availability.rounds?snapshot.thisWeekAssessmentCount:null,
    interviews:availability.rounds?snapshot.upcomingInterviewCount:null,
    thisWeekInterviews:availability.rounds?snapshot.thisWeekInterviewCount:null,
    attention:availability.rounds?snapshot.needsAttention:null,
    urgentAssessment:availability.rounds?snapshot.urgentAssessment:null,
    urgentInterview:availability.rounds?snapshot.urgentInterview:null,
    nextScheduledEvent:availability.rounds?snapshot.nextScheduledEvent:null,
    attentionTotal:availability.rounds?snapshot.fullAttentionCount:null,
    attentionOverflow:availability.rounds
      ? Math.max(0,snapshot.fullAttentionCount-snapshot.needsAttention.length):null,
    weekEvents:availability.rounds?snapshot.weekEvents:null,
    weekDays:availability.rounds?snapshot.weekDays:null,
    fullWeekEventCount:availability.rounds?snapshot.fullWeekEventCount:null,
    nextAction:availability.jobs&&availability.journey&&availability.rounds&&availability.offers
      ? snapshot.nextAction:null,
    firstRun:availability.journey?snapshot.firstRun:null,
    activeOffers:availability.offers?snapshot.activeOfferCount:null,
  };
}
