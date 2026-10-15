import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectSubmissionReviews, projectSubmissions } from "@/db/schema";
import { can } from "@/modules/permissions/policy";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";
import {
  mentorReviewHistoryPagination, mentorReviewHistoryQuerySchema,
  mentorReviewHistoryLiteralSearch,
} from "./mentor-review-history-model";

/**
 * Registered final-delivery decisions for currently assigned Mentor projects.
 * This is a project review history, not an assertion that this Mentor authored
 * every decision. Raw feedback, submitter identities and URLs are not fetched.
 */
export async function getMentorReviewHistory(context: RequestContext, rawQuery: unknown) {
  const query=mentorReviewHistoryQuerySchema.parse(rawQuery);
  const membership=context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context,"MENTOR") ||
      !can(context,"projects.read",{
        collegeId:membership.collegeId,organizationId:membership.organizationId,
      })) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const modules=await resolveOptionalModuleAccess(context);
  if (!modules.projects.enabled) {
    return {enabled:false as const,query,projects:[] as {id:string;title:string}[],
      ...mentorReviewHistoryPagination(0,1),items:[]};
  }
  const assigned=(await listMyProjectInstances(context))
    .filter(row=>row.memberRole==="MENTOR");
  const ids=assigned.map(row=>row.project.id);
  const projects=assigned.map(row=>({id:row.project.id,title:row.project.title}));
  if(query.projectId&&!ids.includes(query.projectId))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if (!ids.length) {
    return {enabled:true as const,query,projects,
      ...mentorReviewHistoryPagination(0,1),items:[]};
  }
  const cutoff=query.window==="ALL"?null:
    new Date(new Date().getTime()-(query.window==="LAST_7_DAYS"?7:30)*86400000);
  const filter=and(
    inArray(projectSubmissionReviews.projectId,ids),
    query.projectId?eq(projectSubmissionReviews.projectId,query.projectId):undefined,
    query.version!==undefined?eq(projectSubmissions.version,query.version):undefined,
    eq(projectInstances.collegeId,membership.collegeId),
    cutoff?gte(projectSubmissionReviews.reviewedAt,cutoff):undefined,
    query.search?ilike(projectInstances.title,"%"+mentorReviewHistoryLiteralSearch(query.search)+"%"):undefined,
    query.decision==="ALL" ? undefined :
      eq(projectSubmissionReviews.decision,query.decision),
  );
  const db=getDb();
  const [summary]=await db.select({total:count()})
    .from(projectSubmissionReviews)
    .innerJoin(projectInstances,eq(projectInstances.id,projectSubmissionReviews.projectId))
    .innerJoin(projectSubmissions,and(
      eq(projectSubmissions.id,projectSubmissionReviews.submissionId),
      eq(projectSubmissions.projectId,projectSubmissionReviews.projectId),
    )).where(filter);
  const pagination=mentorReviewHistoryPagination(Number(summary?.total??0),query.page);
  const items=await db.select({
    id:projectSubmissionReviews.id,
    projectId:projectInstances.id,
    projectTitle:projectInstances.title,
    decision:projectSubmissionReviews.decision,
    version:projectSubmissions.version,
    reviewedAt:projectSubmissionReviews.reviewedAt,
  }).from(projectSubmissionReviews)
    .innerJoin(projectInstances,eq(projectInstances.id,projectSubmissionReviews.projectId))
    .innerJoin(projectSubmissions,and(
      eq(projectSubmissions.id,projectSubmissionReviews.submissionId),
      eq(projectSubmissions.projectId,projectSubmissionReviews.projectId),
    )).where(filter)
    .orderBy(query.order==="OLDEST"?asc(projectSubmissionReviews.reviewedAt):desc(projectSubmissionReviews.reviewedAt),
      query.order==="OLDEST"?asc(projectSubmissionReviews.id):desc(projectSubmissionReviews.id))
    .limit(pagination.pageSize)
    .offset((pagination.page-1)*pagination.pageSize);
  return {enabled:true as const,query,projects,...pagination,items};
}
