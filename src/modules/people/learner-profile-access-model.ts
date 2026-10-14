import type {RequestContext} from "@/modules/identity/context";
export type LearnerProfilePrincipal={
  membershipId:string;userId:string;collegeId:string;organizationId:string;
  status:string;platformStatus:string;role:string;
};
export function ownLearnerProfilePrincipalMatches(context:RequestContext,row:LearnerProfilePrincipal|null){
  const member=context.membership;
  return !!member&&!!row&&context.user.platformStatus==="ACTIVE"&&member.status==="ACTIVE"&&
    member.roles.includes("LEARNER")&&row.membershipId===member.id&&row.userId===context.user.id&&
    row.collegeId===member.collegeId&&row.organizationId===member.organizationId&&
    row.status==="ACTIVE"&&row.platformStatus==="ACTIVE"&&row.role==="LEARNER";
}
