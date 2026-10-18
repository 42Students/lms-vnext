import "server-only";
import {and,asc,count,eq,ilike,or,isNull,isNotNull} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {academicPeriods,cohorts,colleges,collegeMemberships,courseOfferings,courseSectionDeliveries,courseTeachingAssignments,
 courses,departments,programs,sections,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
const sectionDepartment=alias(departments,"admin_faculty_section_department");
export async function listAdminFacultyAssignments(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"courses.read"),db=getDb();
 const active=and(isNull(courseTeachingAssignments.endedAt),isNull(courseSectionDeliveries.endedAt));
 const source=db.select({
  id:aliasedColumn(courseTeachingAssignments.id,"admin_teacher_assignment_id"),
  role:courseTeachingAssignments.role,startedAt:courseTeachingAssignments.startedAt,
  teachingEnded:aliasedColumn(courseTeachingAssignments.endedAt,"admin_teacher_assignment_ended_at"),
  deliveryEnded:aliasedColumn(courseSectionDeliveries.endedAt,"admin_teacher_delivery_ended_at"),
  teacherName:aliasedColumn(users.displayName,"admin_teacher_name"),
  courseName:aliasedColumn(courses.name,"admin_teacher_course_name"),
  courseCode:courses.code,
  sectionName:aliasedColumn(sections.name,"admin_teacher_section_name"),
  sectionId:sections.id,
  periodName:academicPeriods.name,
  periodYear:academicPeriods.startDate,
  deliveryId:aliasedColumn(courseSectionDeliveries.id,"admin_teacher_delivery_id"),
 }).from(courseTeachingAssignments)
 .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
 .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,selected.collegeId)))
 .innerJoin(sections,and(
  eq(sections.id,courseSectionDeliveries.sectionId),
  eq(sections.cohortId,courseOfferings.cohortId),
  eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
 ))
 .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),eq(academicPeriods.collegeId,selected.collegeId)))
 .innerJoin(cohorts,and(
  eq(cohorts.id,sections.cohortId),
  eq(cohorts.id,courseOfferings.cohortId),
 ))
 .innerJoin(programs,eq(programs.id,cohorts.programId))
 .innerJoin(sectionDepartment,and(eq(sectionDepartment.id,programs.departmentId),eq(sectionDepartment.collegeId,selected.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,departments.collegeId),
  selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
  eq(collegeMemberships.collegeId,selected.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(
  query.status==="ACTIVE"?active:query.status==="ENDED"?
   or(isNotNull(courseTeachingAssignments.endedAt),isNotNull(courseSectionDeliveries.endedAt)):undefined,
  query.sectionId?eq(sections.id,query.sectionId):undefined,
  query.q?or(ilike(users.displayName,scopedSearchLike(query.q)),ilike(courses.name,scopedSearchLike(query.q)),ilike(sections.name,scopedSearchLike(query.q))):undefined,
 )).as("admin_faculty_assignment_directory");
 const [countRow]=await db.select({total:count()}).from(source);
 const total=countRow?.total??0;
 const totalPages=superAdminReadPages(total,query.pageSize);
 // A removed teaching grant can invalidate a bookmarked deep link. Return
 // the last real page instead of an empty page with an impossible label.
 const page=Math.min(query.page,totalPages);
 const rows=await db.select().from(source)
  .orderBy(asc(source.teacherName),asc(source.courseName),asc(source.id))
  .limit(query.pageSize).offset((page-1)*query.pageSize);
 const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(value)+" IST";
 return {query:{...query,page},total,totalPages,items:rows.map(row=>({
  id:row.id,title:row.teacherName||"Unnamed faculty",subtitle:row.courseName+" ("+row.courseCode+")",
  status:row.teachingEnded||row.deliveryEnded?"ENDED":"ACTIVE",
  details:["Class: "+row.sectionName,"Semester: "+row.periodName,"Year: "+row.periodYear.slice(0,4),
   "Teaching role: "+row.role,"Active: "+(row.teachingEnded||row.deliveryEnded?"No":"Yes"),"Started: "+format(row.startedAt)],
 }))};
}

/** Only selected-college classes can become assignment search facets. */
export async function getSuperAdminFacultyAssignmentClasses(context:RequestContext){
 const selected=requireSuperAdminSelectedCollege(context,"courses.read"),db=getDb();
 return db.select({id:sections.id,name:sections.name}).from(sections)
  .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),
    eq(academicPeriods.collegeId,selected.collegeId)))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
  .orderBy(asc(sections.name),asc(sections.id)).limit(2000);
}
