import "server-only";
import {and,asc,count,eq,exists,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {cohorts,colleges,collegeMemberships,departments,facultyProfiles,learnerProfiles,
 learnerProgramEnrollments,membershipRoles,programs,sectionEnrollments,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listAdminScopedPeople(context:RequestContext,role:"FACULTY"|"LEARNER",raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),
  selected=requireSuperAdminSelectedCollege(context,"people.manage"),db=getDb();
 const enrollmentFilter=role==="LEARNER"&&(query.programId||query.cohortId||query.departmentId||query.sectionId)
  ?exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
    .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
    .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
    .leftJoin(sectionEnrollments,and(eq(sectionEnrollments.learnerEnrollmentId,learnerProgramEnrollments.id),
      eq(sectionEnrollments.status,"ACTIVE")))
    .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
      eq(learnerProgramEnrollments.status,"ACTIVE"),
      query.programId?eq(programs.id,query.programId):undefined,
      query.cohortId?eq(cohorts.id,query.cohortId):undefined,
      query.departmentId?eq(departments.id,query.departmentId):undefined,
      query.sectionId?eq(sectionEnrollments.sectionId,query.sectionId):undefined,
    ))):undefined;
 const source=db.select({
  id:aliasedColumn(collegeMemberships.id,"admin_role_membership_id"),
  status:aliasedColumn(collegeMemberships.status,"admin_role_membership_status"),
  joinedAt:collegeMemberships.createdAt,
  name:aliasedColumn(users.displayName,"admin_role_user_name"),
  platformStatus:users.platformStatus,
  collegeName:aliasedColumn(colleges.name,"admin_role_college_name"),
  departmentName:departments.name,
  employmentType:facultyProfiles.employmentType,
  academicTitle:facultyProfiles.academicTitle,
  rollNumber:learnerProfiles.rollNumber,
 }).from(collegeMemberships)
 .innerJoin(colleges,and(eq(colleges.id,collegeMemberships.collegeId),
  eq(colleges.id,selected.collegeId),
  selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,role)))
 .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
 .leftJoin(departments,and(eq(departments.id,facultyProfiles.primaryDepartmentId),
  eq(departments.collegeId,selected.collegeId)))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .where(and(
  query.status==="ALL"?undefined:eq(collegeMemberships.status,query.status as "ACTIVE"|"SUSPENDED"|"ENDED"),
  role==="FACULTY"&&query.departmentId?eq(departments.id,query.departmentId):undefined,
  role==="FACULTY"&&query.employmentType?eq(facultyProfiles.employmentType,query.employmentType):undefined,
  enrollmentFilter,
  query.q?or(ilike(users.displayName,scopedSearchLike(query.q)),
   ilike(users.email,scopedSearchLike(query.q)),
   role==="LEARNER"?ilike(learnerProfiles.rollNumber,scopedSearchLike(query.q)):undefined):undefined,
 )).as("super_admin_role_directory");
 const [counts,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.name),asc(source.id))
   .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=counts[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(row=>({
  id:row.id,title:row.name||"Unnamed person",subtitle:row.collegeName+" · "+role,
  status:row.status,
  details:[
   ...(role==="FACULTY"?[
    "Department: "+(row.departmentName??"Not assigned"),
    "Type: "+(row.employmentType??"Not set"),
    "Academic title: "+(row.academicTitle??"Not set"),
   ]:["Roll number: "+(row.rollNumber??"Not recorded")]),
   "Platform account: "+row.platformStatus,"Joined: "+fmt.format(row.joinedAt)+" IST",
   "Private contact details are not shown in this directory.",
  ],
  href:`/admin/people/directory/${encodeURIComponent(row.id)}`,
 }))};
}
