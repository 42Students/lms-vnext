import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,colleges,membershipRoles,users} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {adminMembershipDetailIdSchema,projectAdminMembershipDetail} from "./admin-membership-detail-model";
export async function getSuperAdminMembershipDetail(context:RequestContext,rawId:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("people.manage");
 const parsed=adminMembershipDetailIdSchema.safeParse(rawId);
 if(!parsed.success)return null;
 const selected=context.adminScope;
 requirePermission(context,"people.manage",{...(selected?.organizationId ? {organizationId:selected.organizationId} : {}),...(selected?.collegeId ? {collegeId:selected.collegeId} : {})});
 const [row]=await getDb().select({
  id:collegeMemberships.id,userId:users.id,collegeId:colleges.id,collegeName:colleges.name,
  name:users.displayName,platformStatus:users.platformStatus,membershipStatus:collegeMemberships.status,
  email:sql<string|null>`case when ${Boolean(selected?.collegeId)} then ${users.email} else null::text end`.as("scoped_email"),
  phoneE164:sql<string|null>`case when ${Boolean(selected?.collegeId)} then ${users.phoneE164} else null::text end`.as("scoped_phone"),
  createdAt:collegeMemberships.createdAt,updatedAt:collegeMemberships.updatedAt,
 }).from(collegeMemberships)
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
 .where(and(eq(collegeMemberships.id,parsed.data),
   selected?.collegeId?eq(colleges.id,selected.collegeId):undefined,
   selected?.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .limit(1);
 if(!row)return null;
 const roles=await getDb().select({role:membershipRoles.role}).from(membershipRoles)
  .where(eq(membershipRoles.membershipId,row.id));
 return projectAdminMembershipDetail({
  id:row.id,userId:row.userId,name:row.name,collegeName:row.collegeName,
  platformStatus:row.platformStatus,membershipStatus:row.membershipStatus,
  roles:roles.map(x=>x.role).sort(),email:row.email,phoneE164:row.phoneE164,
  createdAt:row.createdAt,updatedAt:row.updatedAt,
 },selected?.collegeId??null,row.collegeId);
}
