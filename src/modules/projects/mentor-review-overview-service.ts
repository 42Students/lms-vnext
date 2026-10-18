import "server-only";
import {and,count,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectSubmissionReviews,projectSubmissions} from "@/db/schema";
import {can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {
 mentorReviewOverviewSchema,classifyMentorDeliveryReview,mentorDeliveryReviewCounts,
} from "./mentor-review-overview-model";

/** Only registered per-version final delivery and review facts. Never infer absent history. */
export async function getMentorDeliveryReviewOverview(context:RequestContext,raw:unknown){
 const query=mentorReviewOverviewSchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR"))
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 // A disabled tenant must not enumerate delivery review project identities.
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const scope=await requireProjectReadAccess(context,query.projectId);
 if(scope.access!=="MENTOR"||!can(context,"projects.read",{
  collegeId:scope.collegeId,organizationId:scope.organizationId,
 }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const db=getDb();
 const feedbackWith=sql<boolean>`coalesce(trim(${projectSubmissionReviews.feedback}), '') <> ''`;
 const feedbackWithout=sql<boolean>`coalesce(trim(${projectSubmissionReviews.feedback}), '') = ''`;
 const filters=and(eq(projectSubmissions.projectId,scope.project.id),
   query.status==="ALL"?undefined:eq(projectSubmissions.status,query.status),
   query.version!==undefined?eq(projectSubmissions.version,query.version):undefined,
   query.feedback==="WITH"?feedbackWith:
     query.feedback==="WITHOUT"?feedbackWithout:undefined);
 const [totalRow]=await db.select({total:count()}).from(projectSubmissions)
  .leftJoin(projectSubmissionReviews,and(
   eq(projectSubmissionReviews.submissionId,projectSubmissions.id),
   eq(projectSubmissionReviews.projectId,projectSubmissions.projectId),
  ))
  .where(filters);
 const total=Number(totalRow?.total??0);
 const pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(query.page,totalPages);
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
  .where(filters)
  .orderBy(desc(projectSubmissions.version),desc(projectSubmissions.id))
  .limit(pageSize).offset((page-1)*pageSize);
 const items=rows.map(({feedback,...row})=>{
  const feedbackPresent=Boolean(feedback?.trim());
  return {...row,feedbackPresent,
   reviewLabel:classifyMentorDeliveryReview({
    status:row.status,decision:row.decision,feedbackPresent,
   })};
 });
 return {project:{id:scope.project.id,title:scope.project.title,status:scope.project.status},
  query,total,page,pageSize,totalPages,items,
  counts:mentorDeliveryReviewCounts(items)};
}
