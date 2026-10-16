import "server-only";
import {and,asc,count,eq,ilike} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listAdminScopedPeople(context:RequestContext,role:"FACULTY"|"LEARNER",raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"people.manage"),db=getDb();
 const source=db.select({
  id:aliasedColumn(collegeMemberships.id,"admin_role_membership_id"),
  status:aliasedColumn(collegeMemberships.status,"admin_role_membership_status"),
  joinedAt:collegeMemberships.createdAt,
  name:aliasedColumn(users.displayName,"admin_role_user_name"),
  platformStatus:users.platformStatus,
  collegeName:aliasedColumn(colleges.name,"admin_role_college_name"),
 }).from(collegeMemberships)
 .innerJoin(colleges,and(eq(colleges.id,collegeMemberships.collegeId),
  eq(colleges.id,selected.collegeId),
  selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,role)))
 .where(and(
  query.status==="ALL"?undefined:eq(collegeMemberships.status,query.status as "ACTIVE"|"SUSPENDED"|"ENDED"),
  query.q?ilike(users.displayName,scopedSearchLike(query.q)):undefined,
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
  details:["Platform account: "+row.platformStatus,"Joined: "+fmt.format(row.joinedAt)+" IST",
   "Private contacts are not included in this directory."],
  href:`/admin/people/directory/${encodeURIComponent(row.id)}`,
 }))};
}
