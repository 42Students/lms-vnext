import "server-only";

import {and,asc,desc,eq,gte,ilike,inArray,isNull,lt,lte,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,placementCompanies,placementCompanyRelationships,placementJobs} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import {isExactRecruiterEmployerRow} from "./recruiter-own-company-policy";
import {HR_DRIVE_PAGE_SIZE,type RecruiterDriveListQuery} from "./recruiter-drive-list-model";
import type {listOwnRecruiterPlacementJobs} from "./recruiter-service";

/** REC-home-drives-R08: page and filter the authorized job set in PostgreSQL. */
export async function searchOwnRecruiterDrives(
 context:RequestContext,collegeId:string,query:RecruiterDriveListQuery,now:Date,
 options:{pageSize?:number;descendingDeadline?:boolean;previewOnly?:boolean}={},
){
 if(!hasActiveRecruiter(context)||!context.recruiter)
  throw new AuthorizationError("placements.recruiter.read");
 const grants=context.recruiter.grants.filter(grant=>grant.collegeId===collegeId);
 if(!grants.length)throw new AuthorizationError("placements.recruiter.read");
 const relationshipIds=[...new Set(grants.map(grant=>grant.companyRelationshipId))];
 const pageSize=Math.max(1,Math.min(201,Math.trunc(options.pageSize??HR_DRIVE_PAGE_SIZE)));

 const base=()=>getDb().select({
  job:placementJobs,
  relationshipId:placementCompanyRelationships.id,
  collegeId:colleges.id,
  collegeName:colleges.name,
  companyId:placementCompanies.id,
  companyName:placementCompanies.name,
  companyLogoUrl:placementCompanies.logoPublicUrl,
 }).from(placementJobs)
  .innerJoin(placementCompanyRelationships,
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
  .innerJoin(placementCompanies,
   eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId));
 const scope=and(
  inArray(placementJobs.companyRelationshipId,relationshipIds),
  recruiterOwnJobPredicate(context.user.id),
  eq(placementJobs.collegeId,collegeId),
  eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
  eq(placementCompanies.id,context.recruiter.companyId),
  eq(placementCompanyRelationships.status,"ACTIVE"),
  eq(placementCompanies.status,"ACTIVE"),
  eq(colleges.status,"ACTIVE"),
  isNull(placementJobs.archivedAt),
  inArray(placementJobs.status,["PUBLISHED","CLOSED","CANCELLED"]),
 );
 const counts=options.previewOnly?[]:await getDb().select({
  status:placementJobs.status,
  count:sql<number>`count(*)::integer`,
 }).from(placementJobs)
  .innerJoin(placementCompanyRelationships,
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
  .innerJoin(placementCompanies,
   eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
  .where(scope).groupBy(placementJobs.status);
 const live=Number(counts.find(row=>row.status==="PUBLISHED")?.count??0);
 const closed=counts.filter(row=>row.status==="CLOSED"||row.status==="CANCELLED")
  .reduce((sum,row)=>sum+Number(row.count),0);
 // Pending drive requests have independent identities; never present a request
 // UUID as a placement job. Scope, sort and paginate before returning.
 // Request lists are fetched by the separate, scoped request service.
 // Never count them here: the Drives page adds standalone requests once.
 // This also avoids a first-201 truncation and duplicate counts.
 const totals={all:live+closed,live,closed,waiting:0};
 if(query.view==="WAITING")return {
  rows:[] as Awaited<ReturnType<typeof listOwnRecruiterPlacementJobs>>,
  requests:[] as {id:string;status:string;createdAt:Date;title:string}[],
  total:0,page:1,pages:0,pageSize,totals,
 };
 const escaped=query.q.trim().replace(/[%_\\]/g,"\\$&");
 const criteria=and(
  scope,
  query.view==="LIVE"?eq(placementJobs.status,"PUBLISHED"):undefined,
  query.view==="CLOSED"?inArray(placementJobs.status,["CLOSED","CANCELLED"]):undefined,
  escaped?sql`(${placementJobs.title} ilike ${"%"+escaped+"%"} or ${placementCompanies.name} ilike ${"%"+escaped+"%"})`:undefined,
  query.employment==="ALL"?undefined:eq(placementJobs.employmentType,query.employment),
  query.mode==="ALL"?undefined:eq(placementJobs.workMode,query.mode),
  query.deadline==="UNKNOWN"?isNull(placementJobs.applicationDeadline):undefined,
  query.deadline==="PAST"?lt(placementJobs.applicationDeadline,now):undefined,
  query.deadline==="SOON"?and(eq(placementJobs.status,"PUBLISHED"),
   gte(placementJobs.applicationDeadline,now),
   lte(placementJobs.applicationDeadline,new Date(now.getTime()+7*86400000))):undefined,
  query.deadline==="TODAY"?and(eq(placementJobs.status,"PUBLISHED"),
   sql`(${placementJobs.applicationDeadline} at time zone 'Asia/Kolkata')::date =
    (${now.toISOString()}::timestamptz at time zone 'Asia/Kolkata')::date`):undefined,
 );
 const [totalResult]=options.previewOnly?[]:await getDb().select({count:sql<number>`count(*)::integer`})
  .from(placementJobs)
  .innerJoin(placementCompanyRelationships,
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
  .innerJoin(placementCompanies,
   eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
  .where(criteria);
 const total=Number(totalResult?.count??0);
 const pages=Math.ceil(total/pageSize);
 const page=Math.min(Math.max(1,query.page),Math.max(1,pages));
 const order=query.sort==="TITLE"
  ? [asc(placementJobs.title),asc(placementJobs.id)]
  : query.sort==="DEADLINE"
  ? [options.descendingDeadline
     ? sql`${placementJobs.applicationDeadline} desc nulls last`
     : sql`${placementJobs.applicationDeadline} asc nulls last`,asc(placementJobs.id)]
  : [desc(placementJobs.createdAt),desc(placementJobs.id)];
 const rows=await base().where(criteria).orderBy(...order)
  .limit(pageSize).offset((page-1)*pageSize);
 const visible=rows.filter(row=>isExactRecruiterEmployerRow(context.recruiter!,row));
 for(const row of visible)requirePermission(context,"placements.recruiter.read",{
  collegeId:row.collegeId,placementCompanyRelationshipId:row.relationshipId,
 });
 return {rows:visible,requests:[] as {id:string;status:string;createdAt:Date;title:string}[],
  total:options.previewOnly?visible.length:total,
  page,pages:options.previewOnly?(visible.length?1:0):pages,pageSize,totals};
}
