import type {LearnerPlacementJobItem} from "@/components/placements/learner-placement-jobs";
export type LearnerJobAvailabilityBanner={
  kind:"OPEN"|"APPLIED"|"CLOSED"|"WITHDRAWN"|"EVIDENCE"|"NOT_OPEN";
  title:string;detail:string;
};
/** This is an explanation of the authorized server result, NOT an application permission. */
export function learnerJobAvailabilityBanner(items:readonly LearnerPlacementJobItem[]):LearnerJobAvailabilityBanner|null{
  if(!items.length)return null;
  const open=items.filter(item=>item.canApply).length;
  const submitted=items.filter(item=>item.application?.status==="SUBMITTED").length;
  const withdrawn=items.filter(item=>item.application?.status==="WITHDRAWN").length;
  if(open>0)return {
    kind:"OPEN",title:"You can apply",
    detail:"Review each role and its eligibility checks before confirming any application.",
  };
  if(submitted>0)return {
    kind:"APPLIED",title:"Your application is already recorded",
    detail:"No new application is available on these role options. Your existing submitted application remains visible in My Applications.",
  };
  if(items.every(item=>item.deadlinePassed))return {
    kind:"CLOSED",title:"Applications closed for this drive",
    detail:"The recorded application deadline has passed. You can review published details, but cannot create a new application.",
  };
  if(withdrawn>0)return {
    kind:"WITHDRAWN",title:"Previously withdrawn application",
    detail:"A withdrawn application does not automatically become eligible to submit again. Contact your placement team if a correction is needed.",
  };
  if(items.some(item=>item.eligibility.checks.some(check=>check.status==="MISSING")))return {
    kind:"EVIDENCE",title:"You can\u0027t apply to this drive",
    detail:"Published roles are not currently open to you because eligibility evidence is incomplete. Review your profile or contact your placement team.",
  };
  return {
    kind:"NOT_OPEN",title:"You can\u0027t apply to this drive",
    detail:"Your application or the college eligibility rules prevent a new submission at present. Review the role-specific checks below.",
  };
}
