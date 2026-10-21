import "server-only";
import {and,asc,desc,count,eq,ilike,or,isNull,isNotNull} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {academicPeriods,cohorts,colleges,collegeMemberships,courseOfferings,courseSectionDeliveries,courseTeachingAssignments,
 courses,departments,programs,sections,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole,isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
const sectionDepartment=alias(departments,"admin_faculty_section_department");
/** Legacy shows Sem N only when a term number can be established from an
 * explicit semester code/name. Do not invent it from the year or cohort. */
function legacySemester(periodName:string,periodCode:string){
 const match=[periodCode,periodName].map(value=>
  /(?:^|[\s_-])(?:SEMESTER|SEM|S)[\s_:-]*([1-9][0-9]?)(?:$|[\s_-])/i.exec(value)?.[1])
  .find(Boolean);
 return match?"Sem "+Number(match):"—";
}
function legacyAcademicYear(values:(string|null)[]){
 return values.map(value=>value?.trim()).find(value=>Boolean(value))??"—";
}

function requireAssignmentCollege(context:RequestContext){
 if(isSuperAdmin(context))return requireSuperAdminSelectedCollege(context,"courses.read");
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"COLLEGE_ADMIN"))
  throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{collegeId:membership.collegeId,organizationId:membership.organizationId});
 return {collegeId:membership.collegeId,organizationId:membership.organizationId};
}
/** Both selected Super Admin and authorized College Admin may see their
 * own college. Never trust query-provided collegeId for tenant scope. */
export async function listAdminFacultyAssignments(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireAssignmentCollege(context),db=getDb();
 const active=and(isNull(courseTeachingAssignments.endedAt),isNull(courseSectionDeliveries.endedAt));
 const source=db.select({
  id:aliasedColumn(courseTeachingAssignments.id,"admin_teacher_assignment_id"),
  role:courseTeachingAssignments.role,startedAt:courseTeachingAssignments.startedAt,
  legacyActive:courseTeachingAssignments.legacyWasActive,
  deletedAt:courseTeachingAssignments.deletedAt,
  startDate:courseTeachingAssignments.startDate,endDate:courseTeachingAssignments.endDate,
  importedAcademicYear:courseTeachingAssignments.legacyAcademicYear,
  updatedAt:courseTeachingAssignments.updatedAt,
  teachingEnded:aliasedColumn(courseTeachingAssignments.endedAt,"admin_teacher_assignment_ended_at"),
  deliveryEnded:aliasedColumn(courseSectionDeliveries.endedAt,"admin_teacher_delivery_ended_at"),
  teacherName:aliasedColumn(users.displayName,"admin_teacher_name"),
  courseName:aliasedColumn(courses.name,"admin_teacher_course_name"),
  courseCode:courses.code,courseImageUrl:courses.imageUrl,
  sectionName:aliasedColumn(sections.name,"admin_teacher_section_name"),
  sectionId:sections.id,
  periodName:academicPeriods.name,
  periodCode:academicPeriods.code,
  legacyAcademicYear:academicPeriods.legacyAcademicYearName,
  cohortName:cohorts.name,cohortAcademicYear:cohorts.academicYear,
  cohortLegacyYear:cohorts.legacyAcademicYearRaw,
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
  .orderBy(desc(source.id))
  .limit(query.pageSize).offset((page-1)*query.pageSize);
 const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(value)+" IST";
 return {query:{...query,page},total,totalPages,items:rows.map(row=>({
  id:row.id,title:row.teacherName||"Unnamed faculty",subtitle:row.courseName+" ("+row.courseCode+")",
  revision:row.updatedAt.toISOString(),
  status:row.deletedAt||row.teachingEnded||row.deliveryEnded||row.legacyActive===false?"ENDED":"ACTIVE",
  details:["Class: "+row.sectionName,
   "Batch: "+row.cohortName,
   "Course image: "+(row.courseImageUrl??"Not set"),
   "Semester: "+legacySemester(row.periodName,row.periodCode),
   "Year: "+legacyAcademicYear([row.importedAcademicYear,row.cohortAcademicYear,row.cohortLegacyYear,row.legacyAcademicYear]),
   "Teaching role: "+(row.role??"PRIMARY"),
   "Active: "+(row.deletedAt||row.legacyActive===false||row.teachingEnded||row.deliveryEnded?"No":"Yes"),
   "Metadata incomplete: "+(!row.teacherName||!row.courseName||!row.sectionName?"Yes":"No"),
   ...(row.startDate?["Start date: "+row.startDate]:[]),
   ...(row.endDate?["End date: "+row.endDate]:[]),
   ...(row.deletedAt?["Deleted (retained): "+format(row.deletedAt)]:[]),
   "Started: "+format(row.startedAt),
   ...(row.teachingEnded?["Ended: "+format(row.teachingEnded)]:[]),
   ...(row.deliveryEnded?["Delivery ended: "+format(row.deliveryEnded)]:[])],
 }))};
}

/** Only selected-college classes can become assignment search facets. */
export async function getSuperAdminFacultyAssignmentClasses(context:RequestContext){
 const selected=requireAssignmentCollege(context),db=getDb();
 return db.select({id:sections.id,name:sections.name}).from(sections)
  .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),
    eq(academicPeriods.collegeId,selected.collegeId)))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
  .innerJoin(colleges,and(eq(colleges.id,departments.collegeId),
    selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
  .orderBy(asc(sections.name),asc(sections.id)).limit(2000);
}
