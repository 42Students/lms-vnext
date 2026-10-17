/** TPO-drive-workspace-05: a new draft never silently targets alumni of old hiring seasons.
 * Cohort membership is deliberately reviewed anew, rather than assuming the old
 * cohort is still active. Drafts remain unpublished until the TPO approves them.
 */
export function cloneTpoEligibilityAudience(input:{
 allowedCohortIds:readonly string[];
 allowedPassingYears:readonly number[];
},asOfYear:number){
 if(!Number.isInteger(asOfYear)||asOfYear<2000||asOfYear>9999)
  throw new Error("Invalid current passing year");
 return {
  allowedCohortIds:[] as string[],
  allowedPassingYears:[...new Set(input.allowedPassingYears.filter(
   year=>Number.isInteger(year)&&year>=asOfYear&&year<=asOfYear+10,
  ))].sort((a,b)=>a-b),
  requiresCohortReview:input.allowedCohortIds.length>0,
 };
}
