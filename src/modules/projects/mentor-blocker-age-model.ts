/** The blocker clock starts at an audited transition into BLOCKED, never
 * the task's lastUpdated timestamp (which can move after comments/edits).
 * Imported blocked tasks without transition evidence have UNKNOWN age.
 */
export type MentorBlockerStart={taskId:string;occurredAt:Date|string};
export type MentorBlockerAge={kind:"KNOWN";sinceIso:string;days:number}|
 {kind:"UNKNOWN";sinceIso:null;days:null};
export function mentorBlockerAge(
 taskId:string,transitions:readonly MentorBlockerStart[],now:Date,
):MentorBlockerAge {
 const dates=transitions.filter(row=>row.taskId===taskId).map(row=>
   new Date(row.occurredAt).getTime()).filter(value=>Number.isFinite(value)&&
     value<=now.getTime()).sort((a,b)=>b-a);
 const recent=dates[0];
 return recent===undefined?{kind:"UNKNOWN",sinceIso:null,days:null}:{
  kind:"KNOWN",sinceIso:new Date(recent).toISOString(),
  days:Math.floor((now.getTime()-recent)/86400000),
 };
}
