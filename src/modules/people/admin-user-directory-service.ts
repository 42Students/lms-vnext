import "server-only";
import { and, asc, count, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, colleges, membershipRoles, users } from "@/db/schema";
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
  conditions.push(or(ilike(users.displayName,pattern),ilike(colleges.name,pattern),
   selected?.collegeId ? ilike(users.email,pattern) : undefined,
   selected?.collegeId ? ilike(users.phoneE164,pattern) : undefined)!);
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
   return {...row,roles,
    email:staff&&selected?.collegeId ? row.email : null,
    phoneE164:staff&&selected?.collegeId ? row.phoneE164 : null};
  }),
 };
}
