import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,placementJobs,placementJobRounds} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listSuperAdminInterviews(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const db=getDb();
 const source=db.select({
  id:aliasedColumn(placementJobRounds.id,"admin_round_id"),
  roundName:aliasedColumn(placementJobRounds.name,"admin_round_name"),
  roundKind:placementJobRounds.kind,sequence:placementJobRounds.sequence,
  roundStatus:aliasedColumn(placementJobRounds.status,"admin_round_status"),
  scheduledAt:placementJobRounds.scheduledAt,mode:placementJobRounds.mode,
  jobTitle:aliasedColumn(placementJobs.title,"admin_round_job_title"),
  jobId:aliasedColumn(placementJobs.id,"admin_round_job_id"),
 }).from(placementJobRounds)
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementJobRounds.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(and(
  query.status==="ALL"?undefined:eq(placementJobRounds.status,query.status),
  query.q?or(ilike(placementJobRounds.name,scopedSearchLike(query.q)),ilike(placementJobs.title,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_interview_rounds");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.jobTitle),asc(source.sequence),asc(source.id))
   .limit(SUPER_ADMIN_READ_PAGE_SIZE).offset((query.page-1)*SUPER_ADMIN_READ_PAGE_SIZE),
 ]);
 const total=totals[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total),items:rows.map(row=>({
  id:row.id,title:row.roundName,subtitle:row.jobTitle+" · Round "+row.sequence,
  status:row.roundStatus,details:["Type: "+row.roundKind,"Mode: "+(row.mode??"Not scheduled"),
   "Schedule: "+(row.scheduledAt?fmt.format(row.scheduledAt)+" IST":"Not scheduled")],
  href:`/admin/placements/interviews/${encodeURIComponent(row.id)}`,
 }))};
}
