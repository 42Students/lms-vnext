import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,placementApplications,placementJobs,placementOffers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listSuperAdminOffers(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),scope=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(placementOffers.id,"admin_offer_id"),
  status:aliasedColumn(placementOffers.status,"admin_offer_status"),
  roleTitle:aliasedColumn(placementOffers.roleTitle,"admin_offer_role_title"),
  version:placementOffers.version,
  annualCtcInr:placementOffers.annualCtcInr,joiningDate:placementOffers.joiningDate,
  expiresAt:placementOffers.expiresAt,issuedAt:placementOffers.issuedAt,
  learnerName:aliasedColumn(users.displayName,"admin_offer_learner_name"),
  jobTitle:aliasedColumn(placementJobs.title,"admin_offer_job_title"),
  jobId:aliasedColumn(placementJobs.id,"admin_offer_job_id"),
 }).from(placementOffers)
 .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(query.status==="ALL"?undefined:eq(placementOffers.status,query.status),
  query.q?or(ilike(placementJobs.title,scopedSearchLike(query.q)),ilike(placementOffers.roleTitle,scopedSearchLike(query.q)),ilike(users.displayName,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_offers_directory");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.issuedAt),asc(source.id))
  .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=totals[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(r=>({
  id:r.id,title:r.learnerName||"Unnamed applicant",subtitle:r.jobTitle+" · "+r.roleTitle,
  status:r.status,details:["Offer revision: "+r.version,
   "Annual CTC: "+(r.annualCtcInr===null?"Not recorded":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(r.annualCtcInr)),
   "Joining date: "+(r.joiningDate??"Not set"),
   "Issued: "+fmt.format(r.issuedAt)+" IST",
   "Expires: "+(r.expiresAt?fmt.format(r.expiresAt)+" IST":"Not recorded")],
  href:`/admin/placements/offers/${encodeURIComponent(r.id)}`,
 }))};
}
