/** Audit metadata never includes a bearer URL, raw token, digest or learner data. */
export function companyShareLifecycleActivity(
 action:"ISSUED"|"REVOKED",
 scope:{organizationId:string;collegeId:string;actorUserId:string;actorMembershipId:string;jobId:string;shareId:string},
){
 return {
  organizationId:scope.organizationId,
  collegeId:scope.collegeId,
  actorUserId:scope.actorUserId,
  actorMembershipId:scope.actorMembershipId,
  module:"PLACEMENTS",
  eventType:action==="ISSUED"?"placements.company_share.issued":"placements.company_share.revoked",
  subjectType:"company_applicant_share",
  subjectId:scope.shareId,
  summary:action==="ISSUED"?"Expiring company applicant share created":"Company applicant share revoked",
  metadata:{jobId:scope.jobId},
 };
}
