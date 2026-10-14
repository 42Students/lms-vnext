import {z} from "zod";
import {learnerRoundScheduledInstant,type LearnerRoundBrowseSource} from "./learner-rounds-browse-model";
export const learnerInterviewScheduleViewSchema=z.enum(["all","upcoming","past","unscheduled"]);
export type LearnerInterviewScheduleView=z.infer<typeof learnerInterviewScheduleViewSchema>;
/** Time buckets are not employer attendance, selection or completion outcomes. */
export function learnerInterviewScheduleCounts(
  rounds:readonly LearnerRoundBrowseSource[],nowMs:number,
) {
  const totals={all:rounds.length,upcoming:0,past:0,unscheduled:0};
  for(const round of rounds){
    const due=learnerRoundScheduledInstant(round);
    if(due===null)totals.unscheduled++;
    else if(due>=nowMs)totals.upcoming++;
    else totals.past++;
  }
  return totals;
}
export function learnerInterviewViewHref(currentHref:string,view:LearnerInterviewScheduleView){
  const url=new URL(currentHref,"https://lms.invalid");
  if(view==="all")url.searchParams.delete("view");
  else url.searchParams.set("view",view);
  return url.pathname+url.search+url.hash;
}
