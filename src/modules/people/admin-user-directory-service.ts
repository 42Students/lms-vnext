import "server-only";
import { and, asc, count, eq, exists, ilike, inArray, not, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, colleges, membershipRoles, users, learnerProgramEnrollments, departments, programs, cohorts, sectionEnrollments, sections } from "@/db/schema";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { adminUsersQuerySchema, ADMIN_USERS_PAGE_SIZE, adminUserDirectoryPaging, roleForPeopleTab } from "./admin-user-directory-model";
export async function listSuperAdminUsers(context: RequestContext, raw: unknown) {
 const query=adminUsersQuerySchema.parse(raw);
 if(!isSuperAdmin(context)) throw new AuthorizationError("people.manage");
 const selected=context.adminScope;
 requirePermission(context,"people.manage",{
  organizationId:selected?.organizationId,collegeId:selected?.collegeId,
 });
 const conditions:SQL[]=[];
 if(selected?.collegeId)conditions.push(eq(colleges.id,selected.collegeId));
 if(selected?.organizationId)conditions.push(eq(colleges.organizationId,selected.organizationId));
 if(query.membershipStatus!=="ALL")conditions.push(eq(collegeMemberships.status,query.membershipStatus));
 if(query.platformStatus!=="ALL")conditions.push(eq(users.platformStatus,query.platformStatus));
 const role=roleForPeopleTab(query);
 if(role!=="ALL") {
  const roleIds=getDb().select({id:membershipRoles.membershipId}).from(membershipRoles)
   .where(eq(membershipRoles.role,role as "LEARNER"|"FACULTY"|"COLLEGE_ADMIN"|"MENTOR"|"TPO"));
  conditions.push(inArray(collegeMemberships.id,roleIds));
 }
 if(query.q) {
  const pattern="%"+query.q.replace(/[\\%_]/g,"\\$&")+"%";
  // The global directory searches public names only. Contact-based search
  // requires an explicitly selected college and is never an unscoped lookup.
  const staffRole=exists(getDb().select({id:membershipRoles.id}).from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId,collegeMemberships.id),
      inArray(membershipRoles.role,["FACULTY","TPO","COLLEGE_ADMIN"]))));
  const learnerRole=exists(getDb().select({id:membershipRoles.id}).from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER"))));
  conditions.push(or(ilike(users.displayName,pattern),ilike(colleges.name,pattern),
   selected?.collegeId ? and(staffRole,not(learnerRole),
     or(ilike(users.email,pattern),ilike(users.phoneE164,pattern))) : undefined)!);
 }
 const db=getDb();
 const source=db.select({
  membershipId:sql<string>`${collegeMemberships.id}`.mapWith(collegeMemberships.id).as("membership_id_alias"),
  userId:sql<string>`${users.id}`.mapWith(users.id).as("user_id_alias"),
  displayName:users.displayName,
  email:sql<string|null>`case when ${Boolean(selected?.collegeId)} then ${users.email} else null::text end`.as("scoped_email"),
  phoneE164:sql<string|null>`case when ${Boolean(selected?.collegeId)} then ${users.phoneE164} else null::text end`.as("scoped_phone"),
  platformStatus:users.platformStatus,
  membershipStatus:collegeMemberships.status,
  collegeName:colleges.name,
  collegeCity:colleges.city,collegeState:colleges.state,
  collegeId:sql<string>`${colleges.id}`.mapWith(colleges.id).as("college_id_alias"),
  organizationId:colleges.organizationId,
  updatedAt:collegeMemberships.updatedAt,
 }).from(collegeMemberships)
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
 .where(and(...conditions)).as("admin_user_scope");
 const totals=await db.select({n:count()}).from(source);
 const paging=adminUserDirectoryPaging(totals[0]?.n??0,query.page);
 const rows=await db.select().from(source).orderBy(asc(source.displayName),asc(source.membershipId))
  .limit(ADMIN_USERS_PAGE_SIZE).offset(paging.offset);
 const roleRows=rows.length?await db.select({membershipId:membershipRoles.membershipId,role:membershipRoles.role})
  .from(membershipRoles).where(inArray(membershipRoles.membershipId,rows.map(x=>x.membershipId))):[];
 const byId=new Map<string,string[]>();
 for(const row of roleRows)byId.set(row.membershipId,[...(byId.get(row.membershipId)??[]),row.role]);
 return {
  query:{...query,page:paging.page},contactVisible:Boolean(selected?.collegeId),
  searchScope:selected?.collegeId ? "SELECTED_COLLEGE_STAFF" as const : "GLOBAL_NAME_ONLY" as const,
  total:paging.total,totalPages:paging.totalPages,
  items:rows.map(row=>{
   const roles=byId.get(row.membershipId)??[];
   const staff=roles.some(role=>role==="FACULTY"||role==="TPO"||role==="COLLEGE_ADMIN") && !roles.includes("LEARNER");
   // Even Super Admin search results do not become a learner/recruiter contact
   // enumeration surface; staff contact details require explicit college scope.
   const normalized=row.displayName?.trim()??"";
   const words=normalized?normalized.split(/\s+/):[];
   return {...row,roles,
    displayName:normalized||"—",
    firstName:words[0]??"—",lastName:words.slice(1).join(" "),
    avatarInitial:words[0]?Array.from(words[0])[0].toLocaleUpperCase("en"):"?",
    // Profile pictures need a scoped read grant, not legacy website URLs.
    profileImageUrl:null,
    email:staff&&selected?.collegeId ? row.email : null,
    phoneE164:staff&&selected?.collegeId ? row.phoneE164 : null,
    contactMobile:staff&&selected?.collegeId ? row.phoneE164 : null,
    contactPhone:null,
    primaryRole:roles.includes("FACULTY")?"FACULTY":roles.includes("LEARNER")?"LEARNER":roles[0]??null};

  }),
 };
}

/** Exact display-name existence for the legacy learner picker. Results are
 * drawn from live memberships, not a stale cache; the selected organization/
 * college remains authoritative to prevent accidental cross-tenant discovery.
 */
export async function superAdminLearnerExactNameExists(context:RequestContext,rawName:unknown){
 const name=typeof rawName==="string"?rawName.trim():"";
 if(!name||name.length>200)throw new RangeError("INVALID_LEARNER_NAME");
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("people.manage");
 const selected=context.adminScope;
 requirePermission(context,"people.manage",{
  organizationId:selected?.organizationId,collegeId:selected?.collegeId,
 });
 const [row]=await getDb().select({id:collegeMemberships.id})
  .from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
  .where(and(selected?.collegeId?eq(colleges.id,selected.collegeId):undefined,
    selected?.organizationId?eq(colleges.organizationId,selected.organizationId):undefined,
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
    sql`lower(btrim(${users.displayName}))=lower(${name})`))
  .limit(1);
 return {exists:Boolean(row),status:"Checked" as const};
}

/** Distinct live learner stats, not a count of this page of results. A college
 * admin may obtain the selected college's metrics through the college directory;
 * no faculty/learner role gets an unscoped administrator statistics endpoint.
 */
export async function superAdminLearnerSearchStats(context:RequestContext){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("people.manage");
 const selected=context.adminScope;
 requirePermission(context,"people.manage",{
  organizationId:selected?.organizationId,collegeId:selected?.collegeId,
 });
 const db=getDb();
 const scope=and(
  selected?.collegeId?eq(colleges.id,selected.collegeId):undefined,
  selected?.organizationId?eq(colleges.organizationId,selected.organizationId):undefined,
  eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"));
 const [identities]=await db.select({
  totalLearners:sql<number>`count(distinct ${collegeMemberships.id})::integer`,
  colleges:sql<number>`count(distinct ${colleges.id})::integer`,
 }).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
  .where(scope);
 const [academic]=await db.select({
  departments:sql<number>`count(distinct ${departments.id})::integer`,
  programs:sql<number>`count(distinct ${programs.id})::integer`,
  classes:sql<number>`count(distinct ${sections.id})::integer`,
 }).from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
  .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),
    eq(departments.collegeId,colleges.id)))
  .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),
    eq(cohorts.programId,programs.id)))
  .leftJoin(sectionEnrollments,and(eq(sectionEnrollments.learnerEnrollmentId,learnerProgramEnrollments.id),
    eq(sectionEnrollments.status,"ACTIVE")))
  .leftJoin(sections,and(eq(sections.id,sectionEnrollments.sectionId),
    eq(sections.cohortId,cohorts.id)))
  .where(and(scope,eq(learnerProgramEnrollments.status,"ACTIVE")));
 return {totalLearners:identities?.totalLearners??0,
  colleges:identities?.colleges??0,
  departments:academic?.departments??0,
  programs:academic?.programs??0,classes:academic?.classes??0};
}
