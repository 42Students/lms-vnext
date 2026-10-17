/** SA-placements-projects-56: a successful cohort transaction is atomic.
 * Give each learner a truthful row, never invent partial successes or
 * describe a rolled-back failure as a created workspace.
 */
export function cohortCreationResultRows(
 groups:readonly {membershipIds:readonly string[]}[],
 created:readonly {learnerMembershipId:string;projectId:string;title:string}[],
 alreadyCovered:ReadonlySet<string>,
){
 const byLearner=new Map(created.map(row=>[row.learnerMembershipId,row] as const));
 return groups.flatMap(group=>group.membershipIds.map(membershipId=>{
  const saved=byLearner.get(membershipId);
  if(saved)return {membershipId,status:"CREATED" as const,
   projectId:saved.projectId,title:saved.title};
  if(alreadyCovered.has(membershipId))return {membershipId,status:"ALREADY_COVERED" as const,
   projectId:null,title:null};
  throw new Error("The creation transaction returned an incomplete cohort result.");
 }));
}
