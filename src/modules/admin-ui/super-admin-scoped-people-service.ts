import "server-only";
import {and,asc,count,eq,exists,ilike,or,sql} from "drizzle-orm";
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
  // Legacy person IDs are import provenance, not vNext membership keys. A
  // shared user may have a different faculty or learner row in each college.
  collegeId:aliasedColumn(collegeMemberships.collegeId,"admin_role_college_id"),
  organizationId:aliasedColumn(colleges.organizationId,"admin_role_organization_id"),
  userId:aliasedColumn(users.id,"admin_role_user_id"),
  suspendedAt:collegeMemberships.suspendedAt,
  legacyMembershipId:collegeMemberships.legacyMembershipId,
  joinedAt:collegeMemberships.createdAt,
  name:aliasedColumn(users.displayName,"admin_role_user_name"),
  platformStatus:users.platformStatus,
  email:users.email,phone:users.phoneE164,
  collegeName:aliasedColumn(colleges.name,"admin_role_college_name"),
  departmentName:departments.name,
  employmentType:facultyProfiles.employmentType,
  academicTitle:facultyProfiles.academicTitle,
  facultyDepartmentId:facultyProfiles.primaryDepartmentId,
  legacyFacultyId:facultyProfiles.legacyFacultyId,
  legacyFacultyCode:facultyProfiles.legacyFacultyCode,
  legacyLearnerId:learnerProfiles.legacyLearnerId,
  legacyUniqueId:learnerProfiles.legacyUniqueId,
  registrationNumber:learnerProfiles.registrationNumber,
  mentorRole:sql<boolean>`exists(select 1 from membership_roles mentor_role where mentor_role.membership_id=${collegeMemberships.id} and mentor_role.role='MENTOR')`.as("admin_role_mentor"),
  gender:sql<string|null>`coalesce(
    ${facultyProfiles.profileDocument}->'personalDetails'->>'gender',
    ${learnerProfiles.profileDocument}->'personalDetails'->>'gender'
  )`.as("admin_person_gender"),
  rollNumber:learnerProfiles.rollNumber,
  // Legacy learner.contactMail/contactMobile can differ from the globally
  // verified account identity. Display the learner profile's recorded
  // contact first, with the canonical user account as a safe fallback.
  learnerContactEmail:sql<string|null>`coalesce(
    nullif(${learnerProfiles.profileDocument}->'personalDetails'->>'contactMail',''),
    nullif(${learnerProfiles.profileDocument}->'personalDetails'->>'email',''),
    ${users.email}
  )`.as("admin_learner_contact_email"),
  learnerContactMobile:sql<string|null>`coalesce(
    nullif(${learnerProfiles.profileDocument}->'personalDetails'->>'contactMobile',''),
    nullif(${learnerProfiles.profileDocument}->'personalDetails'->>'mobile',''),
    ${users.phoneE164}
  )`.as("admin_learner_contact_mobile"),
  className:sql<string|null>`(
    select s.name
    from section_enrollments se
    join learner_program_enrollments e on e.id=se.learner_enrollment_id
    join sections s on s.id=se.section_id
      and s.cohort_id=e.cohort_id
      and s.academic_period_id=se.academic_period_id
    join cohorts class_cohort on class_cohort.id=s.cohort_id
    join programs class_program on class_program.id=class_cohort.program_id
      and class_program.id=e.program_id
    join departments class_department on class_department.id=class_program.department_id
      and class_department.college_id=${selected.collegeId}
    where e.membership_id=${collegeMemberships.id}
      and se.status='ACTIVE' and e.status='ACTIVE'
    order by se.created_at desc limit 1
  )`.as("admin_learner_class"),
  // A learner can belong to more than one active academic section. The old
  // grid showed one class, while details must not silently discard the rest.
  classNames:sql<string|null>`(
    select string_agg(distinct s.name, ', ' order by s.name)
    from section_enrollments se
    join learner_program_enrollments e on e.id=se.learner_enrollment_id
    join sections s on s.id=se.section_id and s.cohort_id=e.cohort_id
      and s.academic_period_id=se.academic_period_id
    join cohorts class_cohort on class_cohort.id=s.cohort_id
    join programs class_program on class_program.id=class_cohort.program_id
      and class_program.id=e.program_id
    join departments d on d.id=class_program.department_id
      and d.college_id=${selected.collegeId}
    where e.membership_id=${collegeMemberships.id}
      and e.status='ACTIVE' and se.status='ACTIVE'
  )`.as("admin_learner_classes"),
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
  role==="FACULTY"&&query.employmentType?
    query.employmentType.toLowerCase()==="mentor"
      ?sql`exists(select 1 from membership_roles mentor_filter where mentor_filter.membership_id=${collegeMemberships.id} and mentor_filter.role='MENTOR')`
      :eq(facultyProfiles.employmentType,query.employmentType):undefined,
  enrollmentFilter,
  query.q?or(ilike(users.displayName,scopedSearchLike(query.q)),
   ilike(users.email,scopedSearchLike(query.q)),
   role==="LEARNER"?ilike(learnerProfiles.rollNumber,scopedSearchLike(query.q)):undefined,
   ilike(users.phoneE164,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_role_directory");
 const [countRow]=await db.select({total:count()}).from(source);
 const total=countRow?.total??0;
 // An old bookmarked page can exceed the filtered row count after a role
 // revocation or a new search. Clamp before fetching rows, as in the main
 // Super Admin directory, rather than reporting page 999 of 1 as empty.
 const totalPages=superAdminReadPages(total,query.pageSize);
 const page=Math.min(query.page,totalPages);
 // The old learner roster used numeric-aware roll ordering, while the
 // default faculty/learner directory is sorted by normalized full name.
 const rollSort=sql<string>`case when ${source.rollNumber} ~ '^[0-9]{1,15}$'
    then lpad(${source.rollNumber},15,'0') else coalesce(${source.rollNumber},'') end`;
 const sortKey=role==="LEARNER"&&sortBy==="roll"?rollSort:source.name;
 const rows=await db.select().from(source)
  .orderBy(sortDesc?desc(sortKey):asc(sortKey),asc(source.id))
  .limit(query.pageSize).offset((page-1)*query.pageSize);
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 return {query:{...query,page},total,totalPages,items:rows.map(row=>({
  id:row.id,title:row.name||"-",subtitle:row.collegeName+" · "+role,
  // Legacy suspendedAt means this membership cannot act in the college;
  // a platform block also prevents sign-in even if membership stayed ACTIVE.
  status:row.status==="ACTIVE"&&(row.platformStatus!=="ACTIVE"||row.suspendedAt)
    ?"SUSPENDED":row.status,
  details:[
   ...(role==="FACULTY"?[
    "Department: "+(row.departmentName??"-"),
    "Department ID: "+(row.facultyDepartmentId??"Not assigned"),
    "Type: "+(row.employmentType??row.academicTitle??"Not set"),
    "Faculty type: "+(row.employmentType??"Not set"),
    "Mentor membership: "+(row.mentorRole?"Active":"Not assigned"),
    "Academic title: "+(row.academicTitle??"Not set"),
    "Faculty code: "+(row.legacyFacultyCode??"Not recorded"),
    "Legacy faculty ID: "+(row.legacyFacultyId??"Not recorded"),
    "Gender: "+(row.gender||"-"),
    "Email: "+(row.facultyContactEmail??"-"),"Mobile: "+(row.facultyContactMobile??"-"),
   ]:["Roll number: "+(row.rollNumber??"-"),"Class: "+(row.className??"-"),
     "Classes: "+(row.classNames??"Not assigned"),
     "Student ID: "+(row.legacyUniqueId??"Not recorded"),
     "Registration number: "+(row.registrationNumber??"Not recorded"),
     "Legacy learner ID: "+(row.legacyLearnerId??"Not recorded"),
     "Gender: "+(row.gender||"-"),
     "Email: "+(row.learnerContactEmail??"-"),
     "Mobile: "+(row.learnerContactMobile??"-")]),
   "College ID: "+row.collegeId,
   "Organization ID: "+row.organizationId,
   "Membership ID: "+row.id,
   "Platform account ID: "+row.userId,
   "Legacy membership ID: "+(row.legacyMembershipId??"Not recorded"),
   "Membership suspension: "+(row.suspendedAt?"Suspended":"Not suspended"),
   "Platform account: "+row.platformStatus,"Joined: "+fmt.format(row.joinedAt)+" IST",
   "Contact shown only within selected college administrative scope.",
  ],
  href:`/admin/people/directory/${encodeURIComponent(row.id)}`,
 }))};
}

/** Strictly selected-college suggestions (legacy: 15 search, 10 popular). */
export async function listAdminScopedPeopleSuggestions(
 context:RequestContext,role:"FACULTY"|"LEARNER",search:string,limit=15,
) {
 const bounded=Number.isSafeInteger(limit)?Math.max(1,Math.min(15,limit)):15;
 const q=search.trim().slice(0,100);
 const result=await listAdminScopedPeople(context,role,{
  q,page:1,pageSize:25,status:"ALL",
 });
 return result.items.slice(0,q?bounded:Math.min(10,bounded)).map(row=>({
  id:row.id,label:row.title,kind:role,
  // Historical school-wide caches are intentionally replaced with a fresh,
  // permission-scoped SQL query. Never put contact fields in suggestion data.
  subtitle:row.subtitle,
 }));
}

/** Exact, case-insensitive name check for faculty duplicate warnings.
 * Limited to the selected college and authorized people.manage scope.
 */
export async function existsAdminScopedFacultyName(
 context:RequestContext,facultyName:string,
):Promise<boolean>{
 const name=facultyName.trim();
 if(!name||name.length>100)return false;
 const result=await listAdminScopedPeople(context,"FACULTY",{
  q:name,page:1,pageSize:200,status:"ALL",
 });
 return result.items.some(row=>row.title.localeCompare(name,undefined,{sensitivity:"accent"})===0);
}

/** Counts must be computed inside the same college scope as the roster. */
export async function adminScopedFacultyStats(context:RequestContext){
 const [all,active,suspended]=await Promise.all([
  listAdminScopedPeople(context,"FACULTY",{q:"",page:1,pageSize:10,status:"ALL"}),
  listAdminScopedPeople(context,"FACULTY",{q:"",page:1,pageSize:10,status:"ACTIVE"}),
  listAdminScopedPeople(context,"FACULTY",{q:"",page:1,pageSize:10,status:"SUSPENDED"}),
 ]);
 return {total:all.total,active:active.total,suspended:suspended.total};
}
