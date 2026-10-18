import "server-only";
import {and,asc,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,projectDeliveryEvents,projectSubmissionReviews,projectSubmissions,users} from "@/db/schema";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {mentorDeliveryVersionParamsSchema,mentorDeliveryVersionDisplay}
  from "./mentor-delivery-version-model";

export async function getMentorDeliveryVersion(context:RequestContext,raw:unknown){
  const params=mentorDeliveryVersionParamsSchema.parse(raw);
  const member=context.membership;
  if(!member||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
     !can(context,"projects.read",{
       collegeId:member.collegeId,organizationId:member.organizationId,
     }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  // Module-off must stop before any exact delivery/project enumeration.
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope=await requireProjectReadAccess(context,params.projectId);
  if(scope.access!=="MENTOR"||scope.collegeId!==member.collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const [row]=await getDb().select({
    id:projectSubmissions.id,version:projectSubmissions.version,
    status:projectSubmissions.status,submittedAt:projectSubmissions.submittedAt,
    createdAt:projectSubmissions.createdAt,
    createdByMembershipId:projectSubmissions.createdByMembershipId,
    submittedByMembershipId:projectSubmissions.submittedByMembershipId,
    summary:projectSubmissions.summary,notes:projectSubmissions.notes,
    attachments:projectSubmissions.attachments,
    sourceUrl:projectSubmissions.sourceUrl,demoUrl:projectSubmissions.demoUrl,
    lockedAt:projectSubmissions.lockedAt,reopenedAt:projectSubmissions.reopenedAt,
    decision:projectSubmissionReviews.decision,reviewedAt:projectSubmissionReviews.reviewedAt,
    reviewedByUserId:projectSubmissionReviews.reviewedByUserId,
    feedback:projectSubmissionReviews.feedback,
  }).from(projectSubmissions)
    .leftJoin(projectSubmissionReviews,and(
      eq(projectSubmissionReviews.submissionId,projectSubmissions.id),
      eq(projectSubmissionReviews.projectId,projectSubmissions.projectId),
    ))
    .where(and(eq(projectSubmissions.projectId,scope.project.id),
      eq(projectSubmissions.id,params.submissionId))).limit(1);
  if(!row)throw new ProjectsServiceError("PROJECT_SUBMISSION_NOT_FOUND");
  const membershipIds=[...new Set([row.createdByMembershipId,row.submittedByMembershipId]
    .filter((value):value is string=>Boolean(value)))];
  const people=membershipIds.length?await getDb().select({
    membershipId:collegeMemberships.id,displayName:users.displayName,
  }).from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(inArray(collegeMemberships.id,membershipIds),
      eq(collegeMemberships.collegeId,scope.collegeId))):[];
  const personName=(id:string|null)=>people.find(person=>person.membershipId===id)?.displayName??null;
  const [reviewer]=row.reviewedByUserId?await getDb().select({
    name:users.displayName,
  }).from(users).where(eq(users.id,row.reviewedByUserId)).limit(1):[null];
  const immutableEvents=await getDb().select({
    id:projectDeliveryEvents.id,eventType:projectDeliveryEvents.eventType,
    reason:projectDeliveryEvents.reason,occurredAt:projectDeliveryEvents.occurredAt,
    actorMembershipId:projectDeliveryEvents.actorMembershipId,
  }).from(projectDeliveryEvents).where(and(
    eq(projectDeliveryEvents.projectId,scope.project.id),
    eq(projectDeliveryEvents.submissionId,row.id),
  )).orderBy(asc(projectDeliveryEvents.occurredAt),asc(projectDeliveryEvents.id));
  const actorIds=[...new Set(immutableEvents.map(event=>event.actorMembershipId))]
    .filter(id=>!membershipIds.includes(id));
  const otherActors=actorIds.length?await getDb().select({
    membershipId:collegeMemberships.id,displayName:users.displayName,
  }).from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(inArray(collegeMemberships.id,actorIds),
      eq(collegeMemberships.collegeId,scope.collegeId))):[];
  const eventPerson=(id:string)=>people.concat(otherActors).find(person=>
    person.membershipId===id)?.displayName??"Project member";
  return {reviewedByName:reviewer?.name??null,
    events:immutableEvents.map(event=>({...event,
      actorName:eventPerson(event.actorMembershipId),
    })),createdByName:personName(row.createdByMembershipId),
    submittedByName:personName(row.submittedByMembershipId),
    projectId:scope.project.id,projectTitle:scope.project.title,
    projectStatus:scope.project.status,version:mentorDeliveryVersionDisplay(row)};
}
