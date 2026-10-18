import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,placementApplications,placementJobs,placementOffers,placementJoiningOutcomes,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {superAdminJoiningIntegrityNote} from "./super-admin-joining-integrity-model";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listSuperAdminJoining(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),scope=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(placementJoiningOutcomes.offerId,"admin_joining_offer_id"),
  status:aliasedColumn(placementJoiningOutcomes.status,"admin_joining_status"),
  joiningDate:placementJoiningOutcomes.joiningDate,
  recordedAt:placementJoiningOutcomes.recordedAt,
  offerRole:aliasedColumn(placementOffers.roleTitle,"admin_joining_offer_role"),
  offerStatus:placementOffers.status,
  jobId:aliasedColumn(placementJobs.id,"admin_joining_job_id"),
  jobTitle:aliasedColumn(placementJobs.title,"admin_joining_job_title"),
  applicant:aliasedColumn(users.displayName,"admin_joining_applicant_name"),
 }).from(placementJoiningOutcomes)
 .innerJoin(placementOffers,eq(placementOffers.id,placementJoiningOutcomes.offerId))
 .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(query.status==="ALL"?undefined:eq(placementJoiningOutcomes.status,query.status),
  query.q?or(ilike(placementJobs.title,scopedSearchLike(query.q)),ilike(users.displayName,scopedSearchLike(query.q)),ilike(placementOffers.roleTitle,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_joining_outcomes");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.applicant),asc(source.id))
  .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=totals[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(r=>({
  id:r.id,title:r.applicant||"Unnamed applicant",subtitle:r.jobTitle+" · "+r.offerRole,
  status:r.status,details:["Offer status: "+r.offerStatus,
   "Joining date: "+(r.joiningDate??"Not recorded"),
   "Outcome recorded: "+(r.recordedAt?fmt.format(r.recordedAt)+" IST":"Not recorded"),
   ...(superAdminJoiningIntegrityNote(r.status,r.offerStatus)
     ? [superAdminJoiningIntegrityNote(r.status,r.offerStatus)!] : []),
   "Only persisted joining outcomes are shown; missing records are not counted as pending."],
  href:`/admin/placements/joining/${encodeURIComponent(r.id)}`,
 }))};
}
