import "server-only";
import {and,asc,count,desc,eq,exists,gte,ilike,inArray,lt,not,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users,facultyProfiles,departments} from "@/db/schema";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {visibleContactDetails} from "./college-contacts-privacy";
import {collegeContactAcademicScope} from "./college-contacts-academic-scope";
import {collegeContactsQuerySchema,contactDateWindowValid,contactAcademicFiltersCompatible,contactRoleAudienceCompatible,contactsIstDayStart,contactsNextIstDayStart,collegeContactLiteralPattern} from "./college-contacts-model";

export type CollegeContactRow={
 membershipId:string;name:string;email:string;phone:string;roles:("FACULTY"|"LEARNER")[];
 avatarInitial:string;avatarTint:number;
 status:"ACTIVE"|"SUSPENDED"|"ENDED";joinedAt:Date;
};
export async function listCollegeContacts(context:RequestContext,raw:unknown){
 const filter=collegeContactsQuerySchema.parse(raw);
 if(!contactDateWindowValid(filter))throw new Error("INVALID_CONTACT_DATE_WINDOW");
 if(!contactAcademicFiltersCompatible(filter))throw new Error("INVALID_CONTACT_ACADEMIC_COMBINATION");
 if(!contactRoleAudienceCompatible(filter))throw new Error("INVALID_CONTACT_ROLE_AUDIENCE");
 const claim=context.membership;
 if(!claim||claim.status!=="ACTIVE"||!claim.roles.includes("COLLEGE_ADMIN"))
  throw new AuthorizationError("people.manage");
 return getDb().transaction(async tx=>{
  const checked=await assertPersistedPlatformPermission(tx,context,"people.manage",{
   organizationId:claim.organizationId,collegeId:claim.collegeId,
  });
  if(!checked.membership||checked.membership.id!==claim.id||
     !checked.membership.roles.includes("COLLEGE_ADMIN")||
     checked.membership.collegeId!==claim.collegeId)
   throw new AuthorizationError("people.manage");
  const hasRole=(role:"FACULTY"|"LEARNER")=>exists(
   tx.select({roleId:membershipRoles.id}).from(membershipRoles).where(and(
    eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,role))));
  const faculty=hasRole("FACULTY"),learner=hasRole("LEARNER");
  const academic=collegeContactAcademicScope(claim.collegeId);
  const search=filter.q?"%"+filter.q.replace(/[\\%_]/g,"\\$&")+"%":null;
  const matches=and(eq(collegeMemberships.collegeId,claim.collegeId),
   filter.tab==="FACULTY"?faculty:filter.tab==="STUDENT"?learner:or(faculty,learner),
   filter.status==="ALL"?undefined:eq(collegeMemberships.status,filter.status),
   filter.initial?ilike(users.displayName,filter.initial+"%"):undefined,
   filter.joinedFrom?gte(collegeMemberships.createdAt,contactsIstDayStart(filter.joinedFrom)):undefined,
   filter.joinedThrough?lt(collegeMemberships.createdAt,contactsNextIstDayStart(filter.joinedThrough)):undefined,
   filter.membershipId?eq(collegeMemberships.id,filter.membershipId):undefined,
   filter.accountStatus==="ALL"?undefined:eq(users.platformStatus,filter.accountStatus),
   filter.audience==="FACULTY_ONLY"?and(faculty,sql`not (${learner})`):
   filter.audience==="LEARNER_ONLY"?and(learner,sql`not (${faculty})`):
   filter.audience==="DUAL"?and(faculty,learner):undefined,
   filter.profile==="PROFILED"?or(and(learner,academic.learnerProfile),and(faculty,academic.facultyProfile)):filter.profile==="UNPROFILED"?or(and(learner,not(academic.learnerProfile)),and(faculty,not(academic.facultyProfile))):undefined,
   filter.enrollment==="ACTIVE"?and(learner,academic.activeEnrollment):filter.enrollment==="NONE"?and(learner,not(academic.activeEnrollment)):undefined,
   filter.teaching==="ASSIGNED"?and(faculty,academic.activeTeaching):filter.teaching==="NONE"?and(faculty,not(academic.activeTeaching)):undefined,
   filter.teachingRole!=="ALL"?and(faculty,academic.teachingInRole(filter.teachingRole)):undefined,
   filter.rollPresence==="PRESENT"?and(learner,academic.hasRoll):filter.rollPresence==="MISSING"?and(learner,not(academic.hasRoll)):undefined,
   filter.registrationPresence==="PRESENT"?and(learner,academic.hasRegistration):filter.registrationPresence==="MISSING"?and(learner,not(academic.hasRegistration)):undefined,
   filter.titlePresence==="PRESENT"?and(faculty,academic.hasAcademicTitle):filter.titlePresence==="MISSING"?and(faculty,not(academic.hasAcademicTitle)):undefined,
   filter.departmentPresence==="ASSIGNED"?and(faculty,academic.hasPrimaryDepartment):filter.departmentPresence==="MISSING"?and(faculty,not(academic.hasPrimaryDepartment)):undefined,
   filter.classPresence==="ASSIGNED"&&!(filter.programId||filter.cohortId||filter.sectionId)?and(learner,academic.activeClass):filter.classPresence==="NONE"&&!(filter.cohortId||filter.programId||filter.sectionId)?and(learner,not(academic.activeClass)):undefined,
   filter.cohortId||filter.programId||filter.sectionId?and(learner,academic.inCombinedPlacement(filter)):undefined,
   filter.facultyDepartmentId?and(faculty,academic.inFacultyDepartment(filter.facultyDepartmentId)):undefined,
   filter.employmentType?and(faculty,academic.inEmploymentType(filter.employmentType)):undefined,
   filter.facultyTitleQ?and(faculty,academic.titleMatches(collegeContactLiteralPattern(filter.facultyTitleQ))):undefined,
   search?or(
    ilike(users.displayName,search),
    // Only staff who are not also learners may be located by email.
    // A masked learner contact must not become guessable via search queries.
    and(faculty,sql`not (${learner})`,ilike(users.email,search))
   ):undefined);
  const [countRow]=await tx.select({total:count()}).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(matches);
  const order=filter.sort==="NEWEST"
   ?[desc(collegeMemberships.createdAt),asc(collegeMemberships.id)]
   :filter.sort==="OLDEST"
   ?[asc(collegeMemberships.createdAt),asc(collegeMemberships.id)]
   :filter.sort==="NAME_DESC"
   ?[desc(sql`lower(coalesce(${users.displayName}, ''))`),asc(collegeMemberships.id)]
   :[asc(sql`lower(coalesce(${users.displayName}, ''))`),asc(collegeMemberships.id)];
  const rows=await tx.select({
   membershipId:collegeMemberships.id,name:users.displayName,email:users.email,
   phone:users.phoneE164,status:collegeMemberships.status,joinedAt:collegeMemberships.createdAt,
  }).from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(matches).orderBy(...order).limit(filter.pageSize)
   .offset((filter.page-1)*filter.pageSize);
  const roles=rows.length?await tx.select({membershipId:membershipRoles.membershipId,role:membershipRoles.role})
   .from(membershipRoles).where(and(inArray(membershipRoles.membershipId,rows.map(r=>r.membershipId)),
    inArray(membershipRoles.role,["FACULTY","LEARNER"]))):[];
  const roleMap=new Map<string,("FACULTY"|"LEARNER")[]>();
  for(const role of roles){
   const current=roleMap.get(role.membershipId)??[];
   current.push(role.role as "FACULTY"|"LEARNER");roleMap.set(role.membershipId,current);
  }
  const items:CollegeContactRow[]=rows.map(row=>{
   const memberRoles=roleMap.get(row.membershipId)??[];
   const contact=visibleContactDetails({email:row.email,phone:row.phone,isLearner:memberRoles.includes("LEARNER")});
   const name=row.name?.trim()||"—";
   const avatar=collegeContactAvatar(name);
   return {membershipId:row.membershipId,name,avatarInitial:avatar.initial,avatarTint:avatar.tint,
    email:contact.email,phone:contact.phone,roles:memberRoles,
    status:row.status,joinedAt:row.joinedAt};
  });
  return {items,total:countRow?.total??0,filter,pageSize:filter.pageSize};
 });
}

/** One role-safe public contact, never a private user profile. Foreign college IDs are indistinguishable from missing IDs. */
export async function getCollegeContactById(context:RequestContext,membershipId:string){
 const result=await listCollegeContacts(context,{membershipId,status:"ALL"});
 return result.items[0]??null;
}

/**
 * Legacy staff lookup, deliberately separate from the College Admin directory.
 * Staff may locate colleagues in their current college; learners, recruiters
 * and faculty/learner dual-role records never gain a raw contact search path.
 * Staff email is shared as in the legacy staff directory; phone stays masked.
 * Student/program enumeration is not supported from this endpoint.
 */
const staffContactsFilter=z.strictObject({
 q:z.string().trim().max(100).default(""),
 departmentId:z.uuid().optional(),
 limit:z.coerce.number().int().min(1).max(50).default(20),
});
export type CollegeStaffContactRow={
 membershipId:string;name:string;email:string;phone:string;
 roles:("FACULTY"|"TPO"|"COLLEGE_ADMIN")[];
};
export async function listCollegeStaffContacts(context:RequestContext,raw:unknown){
 const filter=staffContactsFilter.parse(raw);
 const claim=context.membership;
 if(!claim||claim.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
    claim.roles.includes("LEARNER")||
    !claim.roles.some(role=>role==="FACULTY"||role==="TPO"||role==="COLLEGE_ADMIN"))
  throw new AuthorizationError("college.read");
 return getDb().transaction(async tx=>{
  // The common permission helper alone allows learner college.read; always
  // recheck staff-only roles against persisted membership rows under SHARE lock.
  const checked=await assertPersistedPlatformPermission(tx,context,"college.read",{
   organizationId:claim.organizationId,collegeId:claim.collegeId,
  });
  const actor=checked.membership;
  if(!actor||actor.id!==claim.id||actor.collegeId!==claim.collegeId||
     actor.roles.includes("LEARNER")||
     !actor.roles.some(role=>role==="FACULTY"||role==="TPO"||role==="COLLEGE_ADMIN"))
   throw new AuthorizationError("college.read");

  const facultyOnly=actor.roles.includes("FACULTY")&&
    !actor.roles.includes("COLLEGE_ADMIN")&&!actor.roles.includes("TPO");
  let departmentId=filter.departmentId;
  if(facultyOnly){
   const [profile]=await tx.select({departmentId:facultyProfiles.primaryDepartmentId})
    .from(facultyProfiles).where(eq(facultyProfiles.membershipId,actor.id)).limit(1);
   // No verified academic department: fail closed, not an unscoped directory.
   if(!profile?.departmentId || (departmentId&&departmentId!==profile.departmentId))
    throw new AuthorizationError("department.read");
   departmentId=profile.departmentId;
  }
  if(departmentId){
   const [department]=await tx.select({id:departments.id}).from(departments)
    .where(and(eq(departments.id,departmentId),
      eq(departments.collegeId,claim.collegeId),sql`${departments.archivedAt} is null`)).limit(1);
   if(!department)throw new AuthorizationError("department.read");
  }

  const hasRole=(role:"FACULTY"|"TPO"|"COLLEGE_ADMIN"|"LEARNER")=>exists(
   tx.select({roleId:membershipRoles.id}).from(membershipRoles).where(and(
    eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,role))));
  const roleMatch=or(hasRole("FACULTY"),hasRole("TPO"),hasRole("COLLEGE_ADMIN"));
  const learner=hasRole("LEARNER");
  const pattern=filter.q?collegeContactLiteralPattern(filter.q):null;
  const scoped=and(
   eq(collegeMemberships.collegeId,claim.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
   roleMatch,not(learner),
   departmentId?exists(tx.select({id:facultyProfiles.membershipId}).from(facultyProfiles)
    .innerJoin(departments,and(eq(departments.id,facultyProfiles.primaryDepartmentId),
      eq(departments.collegeId,claim.collegeId)))
    .where(and(eq(facultyProfiles.membershipId,collegeMemberships.id),
      eq(departments.id,departmentId)))):undefined,
   pattern?or(ilike(users.displayName,pattern),ilike(users.email,pattern)):undefined,
  );
  const rows=await tx.select({
   membershipId:collegeMemberships.id,name:users.displayName,
   email:users.email,phone:users.phoneE164,
  }).from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(scoped).orderBy(asc(users.displayName),asc(collegeMemberships.id))
   .limit(filter.limit);
  const selectedRoles=rows.length?await tx.select({
   membershipId:membershipRoles.membershipId,role:membershipRoles.role,
  }).from(membershipRoles).where(and(
   inArray(membershipRoles.membershipId,rows.map(row=>row.membershipId)),
   inArray(membershipRoles.role,["FACULTY","TPO","COLLEGE_ADMIN"]))):[];
  const map=new Map<string,CollegeStaffContactRow["roles"]>();
  for(const row of selectedRoles){
   const values=map.get(row.membershipId)??[];
   values.push(row.role as CollegeStaffContactRow["roles"][number]);
   map.set(row.membershipId,values);
  }
  const items:CollegeStaffContactRow[]=rows.map(row=>{
   const visible=visibleContactDetails({
    email:row.email,phone:row.phone,isLearner:false,
   });
   return {
    membershipId:row.membershipId,
    name:row.name?.trim()||"Unnamed person",
    email:visible.email,phone:visible.phone,
    roles:map.get(row.membershipId)??[],
   };
  });
  return {items};
 });
}

/** Stable initials/tint support for the old ContactsGrid avatar treatment.
 * The returned index selects an existing design token; it is not a photo URL,
 * hash of an email, or a materialized personal secret.
 */
export function collegeContactAvatar(name:string):{initial:string;tint:number}{
 const safe=name.trim();
 const initial=safe && safe!=="—"?Array.from(safe)[0].toLocaleUpperCase("en"):"?";
 let hash=2166136261;
 for(const symbol of safe.toLocaleLowerCase("en")){
  hash=Math.imul(hash^symbol.charCodeAt(0),16777619)>>>0;
 }
 return {initial,tint:hash%6};
}

/** Legacy UI DTO bridge. Modern contact visibility stays authoritative:
 * neither an empty photo URL nor a masked mobile is a claim of a public
 * profile-photo/phone read grant. Split-name fields are presentation-only.
 */
export function toLegacyCollegeContactDto(row:CollegeContactRow){
 const words=row.name==="—"?[]:row.name.trim().split(/\s+/);
 return {
  id:row.membershipId, membershipId:row.membershipId,
  firstName:words[0]??"—", lastName:words.slice(1).join(" "),
  userType:row.roles.includes("FACULTY")?"FACULTY":"STUDENT",
  email:row.email==="Not provided"?"—":row.email,
  contactMobile:row.phone==="Not provided"?"—":row.phone,
  // The canonical account has one phone field, not a verified alternate.
  contactPhone:null,
  profileImageUrl:null,
  avatarInitial:row.avatarInitial,avatarTint:row.avatarTint,
  roles:[...row.roles], status:row.status,
 };
}

/** Scoped, zero-based adapter for the old readonly /users/contacts callers.
 * All academic filters are reauthorized inside listCollegeContacts; a
 * combined-role identity is returned once with an explicit roles array.
 * Pagination remains bounded even if a legacy caller omits its old pageSize.
 */
export async function listLegacyCollegeContacts(context:RequestContext,raw:unknown){
 const input=z.strictObject({
  userType:z.string().trim().max(20).default("ALL"),
  collegeId:z.string().uuid().optional(),
  programId:z.string().uuid().optional(),
  departmentId:z.string().uuid().optional(),
  pageNumber:z.coerce.number().int().min(0).max(9999).default(0),
  pageSize:z.union([z.literal(10),z.literal(20),z.literal(25),z.literal(50)]).default(10),
  query:z.string().trim().max(100).default(""),
 }).parse(raw);
 const currentCollege=context.membership?.collegeId;
 if(!currentCollege || (input.collegeId&&input.collegeId!==currentCollege))
  throw new AuthorizationError("people.manage");
 const role=input.userType.toLocaleLowerCase("en");
 const tab=role==="faculty"?"FACULTY" as const:
   role==="learner"||role==="student"?"STUDENT" as const:
   role==="all"?"ALL" as const:null;
 if(!tab)throw new RangeError("INVALID_CONTACT_USER_TYPE");
 const result=await listCollegeContacts(context,{
  tab,programId:input.programId,facultyDepartmentId:input.departmentId,
  page:input.pageNumber+1,pageSize:input.pageSize,q:input.query,
 });
 return {
  contactDTOList:result.items.map(toLegacyCollegeContactDto),
  size:result.total,pageNumber:input.pageNumber,pageSize:input.pageSize,
  totalPages:Math.ceil(result.total/input.pageSize),
  // Kept alongside the old DTO for clients migrated to the canonical model.
  rolesAreDeduplicated:true,
 };
}
