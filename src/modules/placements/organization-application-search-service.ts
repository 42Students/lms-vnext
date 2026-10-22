import "server-only";
import {and,asc,desc,eq,ilike,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,organizations,collegeMemberships,users,placementJobs,placementApplications,
 placementApplicationScreenings,placementJobRoleOptions,placementCompanies,
 placementCompanyRelationships} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";

/** The legacy cache was partitioned by organization and excluded soft deletes.
 * VNext has no application.organizationId: join its college-scoped job to the
 * authoritative colleges.organizationId. Results are live; no refresh job.
 */
export const organizationApplicantSearchSchema=z.strictObject({
 organizationId:z.string().uuid().optional(),
 search:z.string().trim().max(120).default(""),
 status:z.enum(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW",
  "WAITLISTED","OFFERED","REJECTED","HIRED","WITHDRAWN"]).default("ALL"),
 sort:z.enum(["SCORE","NEWEST","NAME"]).default("SCORE"),
 page:z.coerce.number().int().min(1).max(100000).default(1),
 pageSize:z.coerce.number().int().min(1).max(100).default(50),
});

export async function resolveOrganizationPlacementSearchScope(context:RequestContext,requested:string|undefined){
 if(!isSuperAdmin(context))throw new AuthorizationError("placements.read");
 // A selected college is always authoritative. Caller-supplied org IDs may
 // confirm it, never override it (including when a stale tab is still open).
 if(context.adminScope?.collegeId){
  const acting=await resolveActingCollege(context,"placements.read");
  if(requested&&acting.organizationId!==requested)
   throw new AuthorizationError("placements.read");
  await getDb().transaction(async tx=>{
   await assertPersistedPlatformPermission(tx,context,"placements.read",{
    organizationId:acting.organizationId,collegeId:acting.collegeId,
   });
  });
  return acting.organizationId;
 }
 // Organization-scoped Super Admin stays in that organization. Unscoped
 // platform Super Admin must choose an explicit, active organization rather
 // than silently broadening a report to every college in the platform.
 const organizationId=context.adminScope?.organizationId??requested;
 if(!organizationId||(requested&&requested!==organizationId))
  throw new AuthorizationError("placements.read");
 const [active]=await getDb().select({id:organizations.id}).from(organizations)
  .where(and(eq(organizations.id,organizationId),
   eq(organizations.status,"ACTIVE"))).limit(1);
 if(!active)throw new AuthorizationError("placements.read");
 await getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.read",{organizationId});
 });
 return organizationId;
}

// An accepted offer is not a joining outcome. Only a persisted JOINED
// record can put a learner into HIRED; accepted offers awaiting joining remain
// OFFERED. The college's persisted pipeline stage takes precedence over a
// guessed stage from older screening and round-result records.
const collegeStage=sql<string|null>`(select s.stage::text
 from placement_college_application_stages s
 where s.application_id=${placementApplications.id} limit 1)`;
const legacyStage=sql<string>`case
 when ${placementApplications.status}='WITHDRAWN' then 'WITHDRAWN'
 when exists(select 1 from placement_offers o
  join placement_joining_outcomes j on j.offer_id=o.id
  where o.application_id=${placementApplications.id}
   and o.status='ACCEPTED' and j.status='JOINED') then 'HIRED'
 when exists(select 1 from placement_offers o
  where o.application_id=${placementApplications.id}
   and o.status in ('ISSUED','ACCEPTED')) then 'OFFERED'
 when ${collegeStage} is not null then ${collegeStage}
 when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
 when exists(select 1 from placement_round_results rr
  join placement_job_rounds round on round.id=rr.round_id
  where rr.application_id=${placementApplications.id} and rr.status='APPLIED'
  and rr.superseded_at is null and round.kind='INTERVIEW') then 'INTERVIEW'
 when exists(select 1 from placement_round_results rr
  where rr.application_id=${placementApplications.id} and rr.status='APPLIED'
  and rr.superseded_at is null) then 'ASSESSMENT'
 when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
 else 'APPLIED' end`;
const appliedScore=sql<number|null>`(select max(rr.score_percent)
 from placement_round_results rr where rr.application_id=${placementApplications.id}
 and rr.status='APPLIED' and rr.superseded_at is null)`;
const activeApplication=sql<boolean>`${placementApplications.legacyWasDeleted} is distinct from true`;

export async function getOrganizationApplicationStats(context:RequestContext,raw:unknown){
 const input=z.strictObject({organizationId:z.string().uuid().optional()}).parse(raw);
 const organizationId=await resolveOrganizationPlacementSearchScope(context,input.organizationId);
 const [row]=await getDb().select({totalApplications:sql<number>`count(*)::int`})
  .from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,colleges.id)))
  .where(and(eq(colleges.organizationId,organizationId),activeApplication));
 return {organizationId,totalApplications:row?.totalApplications??0,
  cache:"LIVE_DATABASE" as const,refreshRequired:false};
}

/** Authenticated org-wide discovery is Super Admin-only. A caller-supplied
 * organizationId confirms a selected scope, or explicitly chooses one active
 * organization when the platform admin is unscoped. It cannot widen a
 * selected college/organization into a foreign tenant. Includes archived jobs.
 */
export async function searchOrganizationPlacementApplications(context:RequestContext,raw:unknown){
 const input=organizationApplicantSearchSchema.parse(raw);
 const organizationId=await resolveOrganizationPlacementSearchScope(context,input.organizationId);
 const pattern="%"+input.search.replace(/[\\%_]/g,"\\$&")+"%";
 const filters=and(eq(colleges.organizationId,organizationId),activeApplication,
  input.status==="ALL"?undefined:eq(legacyStage,input.status),
  input.search?or(ilike(users.displayName,pattern),ilike(placementJobs.title,pattern),
   ilike(placementCompanies.name,pattern),ilike(legacyStage,pattern),
   ilike(placementJobRoleOptions.title,pattern),ilike(users.email,pattern),
   // Legacy app-search matched the concatenation, including queries which
   // cross learner, role, company and status boundaries.
   ilike(sql<string>`concat_ws(' ', coalesce(${users.displayName},''),
    coalesce(${placementJobs.title},''), coalesce(${placementCompanies.name},''),
    coalesce(${legacyStage},''))`,pattern)):undefined);
 const db=getDb();
 const {totalRow,countRows,records}=await db.transaction(async tx=>{
 const [totalRow]=await tx.select({totalApplications:sql<number>`count(*)::int`})
  .from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,colleges.id)))
  .where(and(eq(colleges.organizationId,organizationId),activeApplication));
 const [countRows,records]=await Promise.all([
  tx.select({total:sql<number>`count(*)::int`}).from(placementApplications)
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,colleges.id)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
    eq(placementJobRoleOptions.jobId,placementJobs.id)))
   .innerJoin(placementCompanyRelationships,and(eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,colleges.id)))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(filters),
  tx.select({id:placementApplications.id,legacyApplicationId:placementApplications.legacyApplicationId,
   learnerId:collegeMemberships.userId,learnerName:users.displayName,
   jobId:placementJobs.id,jobTitle:placementJobs.title,jobStatus:placementJobs.status,
   organizationId:colleges.organizationId,collegeId:colleges.id,
   companyName:placementCompanies.name,role:placementJobRoleOptions.title,
   storedStatus:placementApplications.status,screeningStatus:placementApplicationScreenings.status,
   rejectionMessage:placementApplicationScreenings.candidateMessage,
   applicationStatus:legacyStage,score:appliedScore,
   eligibilityStatus:placementApplications.eligibilityStatus,
   channel:placementApplications.channel,sourceProvider:placementApplications.sourceProvider,
   submittedAt:placementApplications.submittedAt,withdrawnAt:placementApplications.withdrawnAt})
   .from(placementApplications)
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,colleges.id)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
    eq(placementJobRoleOptions.jobId,placementJobs.id)))
   .innerJoin(placementCompanyRelationships,and(eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,colleges.id)))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(filters)
   .orderBy(input.sort==="NAME"?asc(users.displayName):
     input.sort==="NEWEST"?desc(placementApplications.submittedAt):
      sql`${appliedScore} desc nulls last`,
      desc(placementApplications.submittedAt),asc(placementApplications.id))
   .limit(input.pageSize).offset((input.page-1)*input.pageSize),
 ]);
 return {totalRow,countRows,records};
 },{isolationLevel:"repeatable read",accessMode:"read only"});
 const totalMatching=countRows[0]?.total??0;
 return {...input,organizationId,totalApplications:totalRow?.totalApplications??0,
  totalMatching,totalPages:Math.max(1,Math.ceil(totalMatching/input.pageSize)),
  cache:"LIVE_DATABASE" as const,refreshRequired:false,
  records:records.map(row=>({
   id:row.id,legacyApplicationId:row.legacyApplicationId,
   learnerId:row.learnerId,learnerName:row.learnerName,
   jobId:row.jobId,jobTitle:row.jobTitle,companyName:row.companyName,
   organizationId:row.organizationId,collegeId:row.collegeId,
   applicationStatus:row.applicationStatus,storedStatus:row.storedStatus,
   screeningStatus:row.screeningStatus,role:row.role,jobStatus:row.jobStatus,
   eligibilityStatus:row.eligibilityStatus,source:row.channel,
   sourceProvider:row.sourceProvider,score:row.score,
   scoreSource:row.score===null?"NO_APPLIED_RESULT":"BEST_APPLIED_ROUND_PERCENT",
   rejectionReason:row.screeningStatus==="REJECTED"?row.rejectionMessage:null,
   appliedAt:row.submittedAt.toISOString(),withdrawnAt:row.withdrawnAt?.toISOString()??null,
  })),
 };
}
