/** Stable source of tenant attribution for pinned/deleted discussion
 * events. Platform Super Admin may operate in a selected college without a
 * corresponding academic membership. Other actors must belong to the class. */
export function discussionModerationAuditScope(
 delivery:{collegeId:string;organizationId:string},
 actorCollegeId:string|null,
 mode:"ADMIN"|"FACULTY"|"LEARNER",
){
 if(mode!=="ADMIN"&&actorCollegeId!==delivery.collegeId)
  throw new Error("Discussion actor and delivery college differ");
 return {collegeId:delivery.collegeId,organizationId:delivery.organizationId};
}
