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
  const scope=await requireProjectReadAccess(context,params.projectId);
  if(scope.access!=="MENTOR"||scope.collegeId!==member.collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
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
    feedback:projectSubmissionReviews.feedback,
  }).from(projectSubmissions)
    .leftJoin(projectSubmissionReviews,and(
      eq(projectSubmissionReviews.submissionId,projectSubmissions.id),
      eq(projectSubmissionReviews.projectId,projectSubmissions.projectId),
    ))
    .where(and(eq(projectSubmissions.projectId,scope.project.id),
      eq(projectSubmissions.id,params.submissionId))).limit(1);
  if(!row)throw new ProjectsServiceError("PROJECT_SUBMISSION_NOT_FOUND");
  return {projectId:scope.project.id,projectTitle:scope.project.title,
    projectStatus:scope.project.status,version:mentorDeliveryVersionDisplay(row)};
}
