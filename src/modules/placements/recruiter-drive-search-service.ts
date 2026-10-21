import "server-only";

import {and,asc,desc,eq,gte,ilike,inArray,isNull,lt,lte,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,placementCompanies,placementCompanyRelationships,placementJobs} from "@/db/schema";
import {placementRecruiterDriveRequests} from "@/db/schema/placement-drive-requests";
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
 const requestRows=await getDb().select({
   id:placementRecruiterDriveRequests.id,
   status:placementRecruiterDriveRequests.status,
   draft:placementRecruiterDriveRequests.draft,
   createdAt:placementRecruiterDriveRequests.createdAt,
   relationshipId:placementRecruiterDriveRequests.companyRelationshipId,
 }).from(placementRecruiterDriveRequests).where(and(
   eq(placementRecruiterDriveRequests.recruiterUserId,context.user.id),
   eq(placementRecruiterDriveRequests.collegeId,collegeId),
   inArray(placementRecruiterDriveRequests.companyRelationshipId,relationshipIds),
   inArray(placementRecruiterDriveRequests.status,["SENT_BACK","REQUEST","DRAFT","CANCELLED","REJECTED"]),
 )).orderBy(
   sql`case when ${placementRecruiterDriveRequests.status}='SENT_BACK' then 0
       when ${placementRecruiterDriveRequests.status}='REQUEST' then 1
       when ${placementRecruiterDriveRequests.status}='DRAFT' then 2 else 3 end`,
   desc(placementRecruiterDriveRequests.createdAt),desc(placementRecruiterDriveRequests.id),
 ).limit(201);
 const requestProjection=(items:typeof requestRows)=>items.map(item=>({
   id:item.id,status:item.status,createdAt:item.createdAt,
   title:typeof item.draft.title==="string"?item.draft.title.slice(0,240):"Drive request",
 }));
 const waitingRequests=requestRows.filter(row=>
   row.status==="SENT_BACK"||row.status==="REQUEST"||row.status==="DRAFT");
 const closedRequests=requestRows.filter(row=>
   row.status==="CANCELLED"||row.status==="REJECTED");
 for(const row of requestRows)requirePermission(context,"placements.recruiter.read",{
   collegeId,placementCompanyRelationshipId:row.relationshipId,
 });
 const totals={all:live+closed+waitingRequests.length+closedRequests.length,
  live,closed:closed+closedRequests.length,waiting:waitingRequests.length};
 if(query.view==="WAITING"){
  const pages=Math.ceil(waitingRequests.length/pageSize);
  const page=Math.min(Math.max(1,query.page),Math.max(1,pages));
  return {
   rows:[] as Awaited<ReturnType<typeof listOwnRecruiterPlacementJobs>>,
   requests:requestProjection(waitingRequests.slice((page-1)*pageSize,page*pageSize)),
   total:waitingRequests.length,page,pages,pageSize,totals,
  };
 }

 const escaped=query.q.trim().replace(/[%_\\]/g,"\\$&");
 const criteria=and(
  scope,
  query.view==="LIVE"?eq(placementJobs.status,"PUBLISHED"):undefined,
  query.view==="CLOSED"?inArray(placementJobs.status,["CLOSED","CANCELLED"]):undefined,
  escaped?ilike(placementJobs.title,"%"+escaped+"%"):undefined,
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
 return {rows:visible,requests:requestProjection(query.view==="CLOSED"?closedRequests:waitingRequests),
  total:options.previewOnly?visible.length:total,
  page,pages:options.previewOnly?(visible.length?1:0):pages,pageSize,totals};
}
