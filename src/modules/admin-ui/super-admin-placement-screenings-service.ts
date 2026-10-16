import "server-only";
import {and,asc,count,eq,ilike,inArray,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,placementApplications,placementApplicationScreenings,placementJobs,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
const REVIEW_STATUSES=["PENDING","HOLD","REJECTED"] as const;
export async function listSuperAdminScreeningQueue(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),scope=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(placementApplications.id,"admin_screening_application_id"),
  status:aliasedColumn(placementApplicationScreenings.status,"admin_screening_status"),
  decidedAt:placementApplicationScreenings.decidedAt,
  appStatus:aliasedColumn(placementApplications.status,"admin_screening_application_status"),
  jobId:aliasedColumn(placementJobs.id,"admin_screening_job_id"),
  jobTitle:aliasedColumn(placementJobs.title,"admin_screening_job_title"),
  applicant:aliasedColumn(users.displayName,"admin_screening_applicant_name"),
 }).from(placementApplicationScreenings)
 .innerJoin(placementApplications,eq(placementApplications.id,placementApplicationScreenings.applicationId))
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(inArray(placementApplicationScreenings.status,REVIEW_STATUSES),
  query.status==="ALL"?undefined:eq(placementApplicationScreenings.status,query.status),
  query.q?or(ilike(users.displayName,scopedSearchLike(query.q)),ilike(placementJobs.title,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_screening_queue");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.applicant),asc(source.id))
  .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=totals[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(r=>({
  id:r.id,title:r.applicant||"Unnamed applicant",subtitle:r.jobTitle,
  status:r.status,details:["Application: "+r.appStatus,
   "Decision: "+(r.decidedAt?fmt.format(r.decidedAt)+" IST":"Not decided"),
   "Internal review notes are deliberately withheld."],
  href:`/admin/placements/screenings/${encodeURIComponent(r.id)}`,
 }))};
}
