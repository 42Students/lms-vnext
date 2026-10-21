import "server-only";
import {and,eq,ne,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,placementApplications,placementApplicationScreenings,
 placementJobRoleOptions,placementJobRounds,placementJobs,placementRoundResults,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {projectTpoRoundResultTable,tpoRoundResultTableQuerySchema,
 type RoundResultEntry} from "./tpo-round-result-table-model";
export async function getTpoRoundResultTable(context:RequestContext,raw:unknown){
 const collegeId=await requireTpoJobCollege(context);
 const input=tpoRoundResultTableQuerySchema.parse(raw);
 const db=getDb();
 const [scope]=await db.select({id:placementJobRounds.id,name:placementJobRounds.name,
  kind:placementJobRounds.kind,status:placementJobRounds.status,
  jobId:placementJobs.id,jobTitle:placementJobs.title,jobStatus:placementJobs.status})
  .from(placementJobRounds).innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
  .where(and(eq(placementJobRounds.id,input.roundId),eq(placementJobs.id,input.jobId),
   eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!scope)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
 const rows=await db.select({
  applicationId:placementApplications.id,student:users.displayName,role:placementJobRoleOptions.title,
  rollNumber:learnerProfiles.rollNumber,
  applicationStatus:placementApplications.status,
  screeningStatus:placementApplicationScreenings.status,
  resultId:placementRoundResults.id,resultStatus:placementRoundResults.status,
  outcome:placementRoundResults.outcome,
 }).from(placementApplications)
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
  eq(placementJobRoleOptions.jobId,scope.jobId)))
 .leftJoin(placementApplicationScreenings,
  eq(placementApplicationScreenings.applicationId,placementApplications.id))
 .leftJoin(placementRoundResults,and(
  eq(placementRoundResults.applicationId,placementApplications.id),
  eq(placementRoundResults.roundId,scope.id),
  ne(placementRoundResults.status,"SUPERSEDED")))
 .where(and(eq(placementApplications.jobId,scope.jobId),
   eq(placementApplications.status,"SUBMITTED"),
   eq(placementApplicationScreenings.status,"SHORTLISTED")))
 .orderBy(placementApplications.submittedAt,placementApplications.id)
 .limit(501).offset((input.page-1)*500);
 // Full scoped counts are independent of the displayed 500-row page. In
 // particular, eligible candidates beyond the first page remain accessible.
 const [totals]=await db.select({
  eligible:sql<number>`count(distinct ${placementApplications.id})::int`,
  staged:sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementRoundResults.status}='STAGED')::int`,
  applied:sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementRoundResults.status}='APPLIED')::int`,
  remaining:sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementRoundResults.id} is null)::int`,
 }).from(placementApplications)
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
  eq(placementJobRoleOptions.jobId,scope.jobId)))
 .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
 .leftJoin(placementRoundResults,and(eq(placementRoundResults.applicationId,placementApplications.id),
  eq(placementRoundResults.roundId,scope.id),ne(placementRoundResults.status,"SUPERSEDED")))
 .where(and(eq(placementApplications.jobId,scope.jobId),
  eq(placementApplications.status,"SUBMITTED"),
  eq(placementApplicationScreenings.status,"SHORTLISTED")));
 const unique=new Map<string,RoundResultEntry>();
 for(const row of rows.slice(0,500))unique.set(row.applicationId,row);
 const totalEligible=totals?.eligible??0;
 return {round:scope,...projectTpoRoundResultTable([...unique.values()],scope),
  counts:{eligible:totalEligible,staged:totals?.staged??0,
   applied:totals?.applied??0,remaining:totals?.remaining??0},
  page:input.page,totalPages:Math.max(1,Math.ceil(totalEligible/500)),
  truncated:totalEligible>500,hasNext:input.page*500<totalEligible};
}
