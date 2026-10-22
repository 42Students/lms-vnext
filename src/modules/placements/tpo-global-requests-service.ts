import "server-only";
import {z} from "zod";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {departments,placementLearnerRequests,placementApplications,placementJobs} from "@/db/schema";
import {globalTpoRequestsQuerySchema,tpoRequestDateBounds} from "@/modules/placements/tpo-global-requests-model";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { listTpoStudentRequests } from "@/modules/placements/tpo-students-service";
import {requirePersistedTpoMembership} from "@/modules/placements/tpo-persisted-actor-service";
import {decideTpoRequest} from "./tpo-request-decision-service";



export async function getTpoGlobalRequestsInbox(context: RequestContext, rawQuery: unknown) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO") ||
      member.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const query = globalTpoRequestsQuerySchema.parse(rawQuery);
  await requirePersistedTpoMembership(context,member.collegeId);
  await requirePlacementManageScope(context, member.collegeId);
  const result = await listTpoStudentRequests(context, {
    collegeId: member.collegeId,
    status: query.status==="ALL"?undefined:query.status,
    requestType:query.requestType==="ALL"?undefined:query.requestType,
    sort:query.sort,
    requestedBefore:tpoRequestDateBounds(query.age,new Date()).before,
    requestedAfter:tpoRequestDateBounds(query.age,new Date()).after,
    search: query.search,
    urgentOnly:query.urgentOnly ?? false,
    jobId:query.jobId,
    proof:query.proof,branchId:query.branchId,
    registration:query.registration,afterCollege:query.afterCollege,
    page: query.page,
    pageSize: query.pageSize,
  });
  const branches=await getDb().select({id:departments.id,name:departments.name})
    .from(departments).where(eq(departments.collegeId,member.collegeId))
    .orderBy(departments.name);
  return { query, branches, ...result };
}

/** Explicit legacy DTO adapter. The old /pending endpoint was an unwrapped
 * list, but this service may hold more than one bounded page; never silently
 * imply a truncated list contains every unresolved request. */
export async function getLegacyTpoPendingRequests(context:RequestContext){
 const inbox=await getTpoGlobalRequestsInbox(context,{
  status:"PENDING",sort:"OLDEST_FIRST",page:1,pageSize:500,
 });
 if(inbox.total>inbox.requests.length)
  throw new RangeError("Too many pending requests for the legacy single-page endpoint. Use /tpo/requests with pagination.");
 return inbox.requests;
}

/** Old clients sent {approve,reason}, without a revision. Resolve the
 * existing revision inside the active TPO's college and delegate to the
 * authoritative CAS/audit mutation; never trust a supplied college or user.
 * Numeric old IDs have no verified crosswalk and must fail closed. */
export async function decideLegacyTpoRequest(
 context:RequestContext,rawId:unknown,raw:unknown,
){
 const uuid=z.string().uuid().parse(rawId);
 const input=z.strictObject({
  approve:z.boolean(),reason:z.string().trim().max(2000).default(""),
 }).parse(raw);
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||
   member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 await requirePersistedTpoMembership(context,member.collegeId);
 await requirePlacementManageScope(context,member.collegeId);
 const [record]=await getDb().select({
  updatedAt:placementLearnerRequests.updatedAt,
 }).from(placementLearnerRequests)
  .innerJoin(placementApplications,eq(placementApplications.id,placementLearnerRequests.applicationId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .where(and(eq(placementLearnerRequests.id,uuid),
    eq(placementJobs.collegeId,member.collegeId),
    eq(placementLearnerRequests.status,"PENDING"))).limit(1);
 if(!record)throw new Error("Legacy request is not a pending request in this college.");
 return decideTpoRequest(context,uuid,{
  confirmed:true,action:input.approve?"APPROVE":"REJECT",
  note:input.reason,expectedUpdatedAt:record.updatedAt.toISOString(),
 });
}
