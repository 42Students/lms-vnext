import "server-only";
import {and,asc,desc,eq,ilike,inArray,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,departments,learnerProgramEnrollments,placementApplications,
 placementCompanies,placementCompanyRelationships,placementJobRounds,placementJobs,programs,users}
 from "@/db/schema";
import {placementCollegeInterviews as interviews} from "@/db/schema/placement-college-interviews";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {placementTableExists} from "./staged-tables";
export const collegeInterviewFilters=z.object({
 q:z.string().trim().max(100).default(""),
 status:z.enum(["ALL","SCHEDULED","COMPLETED","NO_SHOW","CANCELLED"]).default("ALL"),
 mode:z.enum(["ALL","ON_CAMPUS","VIRTUAL"]).default("ALL"),
 type:z.enum(["ALL","INTERVIEW","GD"]).default("ALL"),
 companyId:z.uuid().optional(),
 departmentId:z.uuid().optional(),
 sort:z.enum(["UPCOMING","RECENT","STUDENT"]).default("UPCOMING"),
 page:z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export async function listCollegeInterviewDirectory(ctx:RequestContext,raw:unknown,options:{exportAll?:boolean}={}){
 const filters=collegeInterviewFilters.parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx);
 if(!await placementTableExists("placement_college_interviews"))
  return {ready:false,filters,rows:[],total:0,pageCount:1,summary:null,limited:false,companies:[],departments:[]};
 const db=getDb();
 const [companies,departmentChoices]=await Promise.all([
  db.select({id:placementCompanies.id,name:placementCompanies.name}).from(placementCompanyRelationships)
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(eq(placementCompanyRelationships.collegeId,collegeId))
   .orderBy(asc(placementCompanies.name)),
  db.select({id:departments.id,name:departments.name}).from(departments)
   .where(eq(departments.collegeId,collegeId)).orderBy(asc(departments.name)),
 ]);

 const conditions=and(eq(placementJobs.collegeId,collegeId),
  filters.status==="ALL"?undefined:eq(interviews.status,filters.status),
  filters.mode==="ALL"?undefined:eq(interviews.mode,filters.mode),
  filters.type==="ALL"?inArray(placementJobRounds.kind,["INTERVIEW","GD"]):eq(placementJobRounds.kind,filters.type),
  filters.companyId?eq(placementCompanyRelationships.companyId,filters.companyId):undefined,
  filters.departmentId?eq(departments.id,filters.departmentId):undefined,
  filters.q?or(ilike(users.displayName,"%"+filters.q+"%"),
   ilike(placementJobs.title,"%"+filters.q+"%"),
   ilike(placementCompanies.name,"%"+filters.q+"%")):undefined);
 const source=db.select({
  id:interviews.id,jobId:interviews.jobId,roundId:interviews.roundId,
  applicationId:interviews.applicationId,studentId:collegeMemberships.id,
  student:users.displayName,company:placementCompanies.name,companyId:placementCompanies.id,
  department:departments.name,job:placementJobs.title,roundName:placementJobRounds.name,
  kind:placementJobRounds.kind,start:interviews.scheduledAt,duration:interviews.durationMinutes,
  status:interviews.status,mode:interviews.mode,venue:interviews.venue,
  meetingUrl:interviews.meetingUrl,version:interviews.version,
 }).from(interviews)
 .innerJoin(placementJobs,eq(placementJobs.id,interviews.jobId))
 .innerJoin(placementApplications,eq(placementApplications.id,interviews.applicationId))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(placementJobRounds,eq(placementJobRounds.id,interviews.roundId))
 .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .leftJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
  eq(learnerProgramEnrollments.status,"ACTIVE")))
 .leftJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
 .leftJoin(departments,eq(departments.id,programs.departmentId))
 .where(conditions);
 const rows=await source.orderBy(filters.sort==="RECENT"?desc(interviews.scheduledAt):
  filters.sort==="STUDENT"?asc(users.displayName):asc(interviews.scheduledAt),asc(interviews.id)).limit(5001);
 const limited=rows.length>5000;
 const selected=rows.slice(0,5000);
 const conflicting=new Set<string>();
 // Conflicts require the same student to be booked in two overlapping
 // active interviews. Same-time college-wide rounds are not a conflict alone.
 const byStudent=new Map<string,typeof selected>();
 for(const row of selected){
  if(row.status!=="SCHEDULED")continue;
  const list=byStudent.get(row.studentId)??[];list.push(row);byStudent.set(row.studentId,list);
 }
 for(const list of byStudent.values()){
  list.sort((a,b)=>a.start.getTime()-b.start.getTime());
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   if(list[j].start.getTime()>=list[i].start.getTime()+list[i].duration*60000)break;
   conflicting.add(list[i].id);conflicting.add(list[j].id);
  }
 }
 const now=new Date();
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const inIndia=(date:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
 const total=selected.length;
 const pages=Math.max(1,Math.ceil(total/25));
 return {ready:true,filters,total,limited,pageCount:pages,
  rows:(options.exportAll?selected:selected.slice((filters.page-1)*25,filters.page*25))
   .map(row=>({...row,conflict:conflicting.has(row.id)})),
  companies,departments:departmentChoices,
  summary:{scheduled:selected.filter(row=>row.status==="SCHEDULED").length,
   today:selected.filter(row=>inIndia(row.start)===today).length,
   companies:new Set(selected.map(row=>row.companyId)).size,
   conflicts:conflicting.size},
 };
}
