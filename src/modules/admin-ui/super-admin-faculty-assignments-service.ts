import "server-only";
import {and,asc,count,eq,ilike,or,isNull,isNotNull} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {cohorts,colleges,collegeMemberships,courseOfferings,courseSectionDeliveries,courseTeachingAssignments,
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
  deliveryId:aliasedColumn(courseSectionDeliveries.id,"admin_teacher_delivery_id"),
 }).from(courseTeachingAssignments)
 .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
 .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,selected.collegeId)))
 .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
 .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
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
  query.q?or(ilike(users.displayName,scopedSearchLike(query.q)),ilike(courses.name,scopedSearchLike(query.q)),ilike(sections.name,scopedSearchLike(query.q))):undefined,
 )).as("admin_faculty_assignment_directory");
 const [counts,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.teacherName),asc(source.courseName),asc(source.id))
   .limit(SUPER_ADMIN_READ_PAGE_SIZE).offset((query.page-1)*SUPER_ADMIN_READ_PAGE_SIZE),
 ]);
 const total=counts[0]?.total??0;
 const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(value)+" IST";
 return {query,total,totalPages:superAdminReadPages(total),items:rows.map(row=>({
  id:row.id,title:row.teacherName||"Unnamed faculty",subtitle:row.courseName+" ("+row.courseCode+")",
  status:row.teachingEnded||row.deliveryEnded?"ENDED":"ACTIVE",
  details:["Class: "+row.sectionName,"Teaching role: "+row.role,"Started: "+format(row.startedAt)],
 }))};
}
