import "server-only";
import {and,desc,eq,ilike} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {listAdminScopedPeople} from "./super-admin-scoped-people-service";
import {scopedSearchLike} from "./super-admin-read-directory-model";

/** Directory suggestions never accept a caller-supplied college/tenant.
 * Recent entries come from actual college membership timestamps. Popular
 * remains absent until a scoped rank/evidence source exists: do not invent
 * popularity from the current table page or from cross-college browser state.
 */
export async function getAdminScopedSearchSuggestions(
 context:RequestContext,kind:"FACULTY"|"LEARNER",rawQ:string,
){
 const scope=requireSuperAdminSelectedCollege(context,"people.manage");
 const q=rawQ.trim().slice(0,100);
 const recent=await getDb().select({name:users.displayName})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(collegeMemberships.collegeId,scope.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,kind),
   q?ilike(users.displayName,scopedSearchLike(q)):undefined))
  .orderBy(desc(collegeMemberships.createdAt),desc(collegeMemberships.id))
  .limit(5);
 const results=q?await listAdminScopedPeople(context,kind,{
  q,status:"ALL",page:1,pageSize:25,
 }):null;
 const unique=(items:readonly string[])=>[...new Set(items.map(x=>x.trim()).filter(Boolean))].slice(0,15);
 return {
  recent:unique(recent.map(row=>row.name).filter((name):name is string=>name!==null)),
  popular:[] as string[],
  results:unique(results?.items.map(row=>row.title)??[]).slice(0,15),
 };
}
