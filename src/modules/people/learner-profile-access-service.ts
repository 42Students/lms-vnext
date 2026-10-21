import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,colleges,membershipRoles,users,learnerProgramEnrollments,sectionEnrollments,sectionFacultyAssignments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {ownLearnerProfilePrincipalMatches} from "./learner-profile-access-model";
export async function requireOwnLearnerProfileAccess(context:RequestContext){
  const member=context.membership;
  if(!member)throw new AuthorizationError("profile.self.manage");
  requirePermission(context,"profile.self.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
  const membershipId=z.uuid().parse(member.id);
  const [row]=await getDb().select({membershipId:collegeMemberships.id,userId:collegeMemberships.userId,
    collegeId:collegeMemberships.collegeId,organizationId:colleges.organizationId,
    status:collegeMemberships.status,platformStatus:users.platformStatus,role:membershipRoles.role,
  }).from(collegeMemberships)
    .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
    .where(eq(collegeMemberships.id,membershipId)).limit(1);
  if(!ownLearnerProfilePrincipalMatches(context,row??null))throw new AuthorizationError("profile.self.manage");
  return member;
}

/** Resolve a target learner from persisted membership; no caller-provided
 * college or session role alone can grant access to a different tenant.
 * Faculty must currently teach the learner's active section. Admins may
 * read only while their active admin membership matches the target college.
 * This does not authorize any learner-profile write.
 */
export async function requireStaffLearnerProfileReadAccess(
 context:RequestContext,rawTargetMembershipId:unknown,
){
 const id=z.uuid().parse(rawTargetMembershipId);
 const actor=context.membership;
 if(context.user.platformStatus!=="ACTIVE"||!actor||actor.status!=="ACTIVE")
  throw new AuthorizationError("people.manage");
 const [learner]=await getDb().select({
  id:collegeMemberships.id,collegeId:collegeMemberships.collegeId,
  userId:collegeMemberships.userId,
 }).from(collegeMemberships)
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,actor.collegeId),
   eq(collegeMemberships.status,"ACTIVE"))).limit(1);
 if(!learner)throw new AuthorizationError("people.manage");
 const [persistedActor]=await getDb().select({id:collegeMemberships.id})
  .from(collegeMemberships).innerJoin(users,and(
   eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.id,actor.id),eq(collegeMemberships.userId,context.user.id),
   eq(collegeMemberships.collegeId,learner.collegeId),
   eq(collegeMemberships.status,"ACTIVE"))).limit(1);
 if(!persistedActor)throw new AuthorizationError("people.manage");
 const allowedRoles=actor.roles.filter(role=>role==="COLLEGE_ADMIN"||role==="FACULTY");
 if(!allowedRoles.length)throw new AuthorizationError("people.manage");
 const persistedRoles=await getDb().select({role:membershipRoles.role})
  .from(membershipRoles).where(eq(membershipRoles.membershipId,actor.id));
 if(allowedRoles.includes("COLLEGE_ADMIN")&&persistedRoles.some(x=>x.role==="COLLEGE_ADMIN"))
  return {membershipId:learner.id,collegeId:learner.collegeId,reason:"COLLEGE_ADMIN" as const};
 if(!allowedRoles.includes("FACULTY")||!persistedRoles.some(x=>x.role==="FACULTY"))
  throw new AuthorizationError("people.manage");
 const [teaching]=await getDb().select({id:sectionFacultyAssignments.id})
  .from(sectionFacultyAssignments)
  .innerJoin(sectionEnrollments,and(
   eq(sectionEnrollments.sectionId,sectionFacultyAssignments.sectionId),
   eq(sectionEnrollments.status,"ACTIVE"),isNull(sectionEnrollments.endedAt)))
  .innerJoin(learnerProgramEnrollments,and(
   eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
   eq(learnerProgramEnrollments.membershipId,learner.id),
   eq(learnerProgramEnrollments.status,"ACTIVE")))
  .where(and(eq(sectionFacultyAssignments.membershipId,actor.id),
   isNull(sectionFacultyAssignments.endedAt))).limit(1);
 if(!teaching)throw new AuthorizationError("people.manage");
 return {membershipId:learner.id,collegeId:learner.collegeId,reason:"CURRENT_TEACHER" as const};
}
/** User-visible outcome after the same permission checks as the underlying
 * read. A missing own-profile row is different from a denied/foreign ID, but
 * that distinction must not be exposed to unauthorized callers. */
export function learnerProfileReadFeedback(result:"OWN_MISSING"|"DENIED"|"UNAVAILABLE"){
 if(result==="OWN_MISSING")return {title:"Profile not set up yet",
  description:"Your learner details are not available yet. Contact your College Admin to complete enrollment.",
  retryable:false};
 if(result==="UNAVAILABLE")return {title:"Could not load your profile",
  description:"Your profile service is temporarily unavailable. Try again.",retryable:true};
 return {title:"Profile access denied",
  description:"You don't have permission to view this profile.",retryable:false};
}
export function learnerProfileIdentityDenial(){
 return "Identity details are restricted to learners and college administrators.";
}
