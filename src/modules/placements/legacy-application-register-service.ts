import "server-only";
import {and,asc,count,desc,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobRoleOptions,placementJobs,users} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobCollege} from "./tpo-job-write-base";

/** Applications remain unique per role+member (not job+member) because
 * multi-role drives exist. Never collapse legitimate role applications. */
const querySchema=z.strictObject({
 page:z.coerce.number().int().min(1).max(10000).default(1),
 history:z.enum(["ACTIVE","ALL","WITHDRAWN"]).default("ACTIVE"),
 stage:z.enum(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW",
  "WAITLISTED","REJECTED","OFFERED","HIRED","WITHDRAWN"]).default("ALL"),
});
export async function listTpoLegacyApplicationRegister(
 context:RequestContext,rawJobId:unknown,raw:unknown,
){
 const collegeId=await requireTpoJobCollege(context);
 const jobId=z.string().uuid().parse(rawJobId);
 const query=querySchema.parse(raw),db=getDb();
 const [job]=await db.select({id:placementJobs.id,title:placementJobs.title})
  .from(placementJobs).where(and(eq(placementJobs.id,jobId),
   eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const stage=sql<string>`case
  when ${placementApplications.status} = 'WITHDRAWN' then 'WITHDRAWN'
  when exists(select 1 from placement_offers o
   left join placement_joining_outcomes j on j.offer_id=o.id
   where o.application_id=${placementApplications.id}
    and o.status='ACCEPTED' and j.status='JOINED') then 'HIRED'
  when exists(select 1 from placement_offers o where
   o.application_id=${placementApplications.id}
   and o.status in ('ISSUED','ACCEPTED')) then 'OFFERED'
  when ${placementCollegeApplicationStages.stage} is not null
   then ${placementCollegeApplicationStages.stage}
  when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
  when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
  else 'APPLIED' end`;
 const conditions=and(eq(placementApplications.jobId,job.id),
  query.history==="ACTIVE"?eq(placementApplications.status,"SUBMITTED"):
   query.history==="WITHDRAWN"?eq(placementApplications.status,"WITHDRAWN"):undefined,
  query.stage==="ALL"?undefined:sql`${stage} = ${query.stage}`);
 const base=db.select({
  id:placementApplications.id,jobId:placementApplications.jobId,
  roleOptionId:placementApplications.roleOptionId,
  roleTitle:placementJobRoleOptions.title,
  membershipId:placementApplications.membershipId,
  candidateName:users.displayName,
  publicRef:placementApplications.publicRef,
  status:placementApplications.status,
  statusBeforeWithdrawal:placementApplications.statusBeforeWithdrawal,
  screeningStatus:placementApplicationScreenings.status,
  effectiveStage:stage.as("effective_stage"),
  channel:placementApplications.channel,
  sourceProvider:placementApplications.sourceProvider,
  submittedAt:placementApplications.submittedAt,
  updatedAt:placementApplications.updatedAt,
  version:placementApplications.version,
 }).from(placementApplications)
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
   eq(placementJobs.collegeId,collegeId)))
  .innerJoin(placementJobRoleOptions,and(
   eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
   eq(placementJobRoleOptions.jobId,jobId)))
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .leftJoin(placementApplicationScreenings,
   eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .leftJoin(placementCollegeApplicationStages,and(
   eq(placementCollegeApplicationStages.applicationId,placementApplications.id),
   eq(placementCollegeApplicationStages.jobId,jobId)))
  .where(conditions);
 const resultSource=base.as("register");
 const [totals,items]=await Promise.all([
  db.select({total:count()}).from(resultSource),
  db.select().from(resultSource).orderBy(
   desc(resultSource.submittedAt),asc(resultSource.id))
   .limit(50).offset((query.page-1)*50),
 ]);
 const total=totals[0]?.total??0;
 return {job,query,total,pageSize:50,totalPages:Math.max(1,Math.ceil(total/50)),
  items:items.map(item=>({...item,
   sourceCode:item.sourceProvider??item.channel,
   submittedAt:item.submittedAt.toISOString(),
   updatedAt:item.updatedAt.toISOString(),
  }))};
}
