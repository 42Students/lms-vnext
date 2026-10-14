import "server-only";

import {and,count,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectSubmissions,projectSubmissionReviews} from "@/db/schema";
import {can} from "@/modules/permissions/policy";
import {
  hasActiveMembership,hasMembershipRole,type RequestContext,
} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {
  mentorReviewCompletenessQuerySchema,projectReviewCompleteness,
  reviewCompletenessPage,reviewCoverageOnPage,
} from "./mentor-review-completeness-model";

/** One assigned Mentor project, one registered version per review, no private feedback text. */
export async function getMentorProjectReviewCompleteness(
  context:RequestContext,raw:unknown,
) {
  const query=mentorReviewCompletenessQuerySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||
    !hasMembershipRole(context,"MENTOR")||
    !can(context,"projects.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const access=await resolveOptionalModuleAccess(context);
  if(!access.projects.enabled)return {
    enabled:false as const,query,projectTitle:null,
    projectStatus:null,...reviewCompletenessPage(0,1),items:[],
    pageCounts:reviewCoverageOnPage([]),
  };
  const scope=await requireProjectReadAccess(context,query.projectId);
  if(scope.access!=="MENTOR"||scope.collegeId!==membership.collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const db=getDb();
  const [summary]=await db.select({total:count()}).from(projectSubmissions)
    .where(eq(projectSubmissions.projectId,scope.project.id));
  const paging=reviewCompletenessPage(Number(summary?.total??0),query.page);
  const rows=await db.select({
    id:projectSubmissions.id,
    version:projectSubmissions.version,
    status:projectSubmissions.status,
    submittedAt:projectSubmissions.submittedAt,
    decision:projectSubmissionReviews.decision,
    reviewedAt:projectSubmissionReviews.reviewedAt,
    feedback:projectSubmissionReviews.feedback,
  }).from(projectSubmissions)
    .leftJoin(projectSubmissionReviews,and(
      eq(projectSubmissionReviews.submissionId,projectSubmissions.id),
      eq(projectSubmissionReviews.projectId,projectSubmissions.projectId),
    ))
    .where(eq(projectSubmissions.projectId,scope.project.id))
    .orderBy(desc(projectSubmissions.version),desc(projectSubmissions.id))
    .limit(paging.pageSize).offset((paging.page-1)*paging.pageSize);
  const computed=projectReviewCompleteness(rows);
  const items=computed.map(row=>({
    id:row.id,version:row.version,status:row.status,
    submittedAt:row.submittedAt,decision:row.decision,
    reviewedAt:row.reviewedAt,reviewRecorded:row.reviewRecorded,
    writtenFeedbackRecorded:row.writtenFeedbackRecorded,
    reviewLabel:row.reviewLabel,
  }));
  return {
    enabled:true as const,query,projectTitle:scope.project.title,
    projectStatus:scope.project.status,...paging,
    items,pageCounts:reviewCoverageOnPage(items),
  };
}
