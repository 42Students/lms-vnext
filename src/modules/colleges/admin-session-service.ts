import "server-only";
import {and,asc,desc,eq,inArray,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {getSuperAdminTenantLifecycleDetail} from "./admin-tenant-lifecycle-service";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {adminSessionHistoryPageSchema} from "./admin-session-query-model";

async function authorizedTarget(ctx:RequestContext,collegeIdInput:unknown,userIdInput:unknown){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("college.manage");
 const collegeId=z.uuid().parse(collegeIdInput),userId=z.uuid().parse(userIdInput);
 const college=await getSuperAdminTenantLifecycleDetail(ctx,collegeId);
 requirePermission(ctx,"college.manage",{collegeId,organizationId:college.organizationId});
 const [member]=await getDb().select({id:collegeMemberships.id,name:users.displayName})
  .from(collegeMemberships)
  // Disabling a user must not make their remaining device sessions
  // impossible to inspect or revoke. Target identity and role remain
  // college-scoped, while the ACTING Super Admin must still be ACTIVE.
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   inArray(membershipRoles.role,["COLLEGE_ADMIN","TPO"])))
  .where(and(eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.userId,userId),
   inArray(collegeMemberships.status,["ACTIVE","SUSPENDED"]))).limit(1);
 if(!member)throw new AuthorizationError("college.manage");
 return {college,userId,name:member.name,membershipId:member.id};
}

/** Only administrators associated with this college may be selected. */
type AdminSessionTarget={userId:string;membershipId:string;status:string;name:string|null;email:string|null;roles:string[]};
/** Historical Faculty.adminType names were scoped roles, not distinct
 * canonical users. Never resolve legacy numeric faculty IDs as UUIDs. */
export function legacyFacultyAdminRole(role:string):"COLLEGE_ADMIN"|"TPO"|null{
 return role==="ADMIN"||role==="COLLEGE_ADMIN"?"COLLEGE_ADMIN":role==="TPO"?"TPO":null;
}
export function collegeAdminSessionDisplay(row:{
 device_name:string|null;user_agent:string|null;ip_address:string|null;last_seen_at:Date|string;
}){
 const rawTime=new Date(row.last_seen_at);
 return {
  device:row.device_name?.trim()||row.user_agent?.trim()||"Unknown device",
  agent:row.user_agent?.trim()||"Unknown browser",
  ip:row.ip_address?.trim()||"—",
  lastUsed:Number.isFinite(rawTime.getTime())
   ?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(rawTime)+" IST"
   :"—",
 };
}
export async function listCollegeAdminSessionTargets(ctx:RequestContext,rawCollegeId:unknown){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("college.manage");
 const collegeId=z.uuid().parse(rawCollegeId);
 const college=await getSuperAdminTenantLifecycleDetail(ctx,collegeId);
 requirePermission(ctx,"college.manage",{collegeId,organizationId:college.organizationId});
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
 const rows=await tx.select({userId:users.id,name:users.displayName,email:users.email,
  membershipId:collegeMemberships.id,status:collegeMemberships.status,
  role:membershipRoles.role}).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   inArray(membershipRoles.role,["COLLEGE_ADMIN","TPO"])))
  .where(and(eq(collegeMemberships.collegeId,collegeId),
    inArray(collegeMemberships.status,["ACTIVE","SUSPENDED"]))).limit(501);
 const map=new Map<string,AdminSessionTarget>();
 for(const row of rows.slice(0,500)){
  const item:AdminSessionTarget=map.get(row.userId)??{userId:row.userId,membershipId:row.membershipId,status:row.status,name:row.name,email:row.email,roles:[]};
  if(!item.roles.includes(row.role))item.roles.push(row.role);
  map.set(item.userId,item);
 }
 if(map.size){
  const allRoles=await tx.select({membershipId:membershipRoles.membershipId,
   role:membershipRoles.role}).from(membershipRoles)
   .where(inArray(membershipRoles.membershipId,[...map.values()].map(item=>item.membershipId)));
  const byMembership=new Map([...map.values()].map(item=>[item.membershipId,item]));
  for(const role of allRoles){
   const item=byMembership.get(role.membershipId);
   if(item&&!item.roles.includes(role.role))item.roles.push(role.role);
  }
 }
 return {college,items:[...map.values()],truncated:rows.length>500};
 });
}

/** Server-side, stable 25-person pages. Joining roles before LIMIT without a
 * groupBy would cut off people with multiple roles and miscount the directory.
 * Authorization is renewed inside the read transaction, not just at entry. */
export async function listCollegeAdminSessionTargetsPage(
 ctx:RequestContext,rawCollegeId:unknown,rawPage:unknown=1,
 roleFilter:"ALL"|"COLLEGE_ADMIN"|"TPO"="ALL",
){
 const page=adminSessionHistoryPageSchema.parse(rawPage),pageSize=25;
 if(!isSuperAdmin(ctx))throw new AuthorizationError("college.manage");
 const collegeId=z.uuid().parse(rawCollegeId);
 const college=await getSuperAdminTenantLifecycleDetail(ctx,collegeId);
 requirePermission(ctx,"college.manage",{collegeId,organizationId:college.organizationId});
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const roleCondition=and(eq(membershipRoles.membershipId,collegeMemberships.id),
   inArray(membershipRoles.role,roleFilter==="ALL"?["COLLEGE_ADMIN","TPO"]:[roleFilter]));
  const scope=and(eq(collegeMemberships.collegeId,college.id),
   inArray(collegeMemberships.status,["ACTIVE","SUSPENDED"]));
  const [counts]=await tx.select({
   total:sql<number>`count(distinct ${collegeMemberships.id})::integer`,
  }).from(collegeMemberships)
   .innerJoin(membershipRoles,roleCondition).where(scope);
  const total=Number(counts?.total??0),pageCount=Math.max(1,Math.ceil(total/pageSize));
  const pageRows=await tx.select({
   userId:users.id,name:users.displayName,email:users.email,
   membershipId:collegeMemberships.id,status:collegeMemberships.status,
  }).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,roleCondition)
   .where(scope)
   .groupBy(collegeMemberships.id,users.id)
   .orderBy(asc(users.displayName),asc(users.id))
   .limit(pageSize).offset((page-1)*pageSize);
  const byMembership=new Map<string,AdminSessionTarget>(pageRows.map(row=>[
   row.membershipId,{...row,roles:[] as string[]},
  ]));
  if(pageRows.length){
   const roles=await tx.select({
    membershipId:membershipRoles.membershipId,role:membershipRoles.role,
   }).from(membershipRoles).where(inArray(
    membershipRoles.membershipId,pageRows.map(row=>row.membershipId),
   )).orderBy(asc(membershipRoles.role));
   for(const role of roles){
    const target=byMembership.get(role.membershipId);
    if(target&&!target.roles.includes(role.role))target.roles.push(role.role);
   }
  }
  return {college,items:[...byMembership.values()],total,page,pageCount,pageSize,truncated:false};
 });
}

export async function listCollegeAdminSessions(
 ctx:RequestContext,collegeId:unknown,userId:unknown,rawPage:unknown=1,
){
 const page=adminSessionHistoryPageSchema.parse(rawPage),pageSize=100;
 const target=await authorizedTarget(ctx,collegeId,userId);
 // A Super Admin's session scope/role can be revoked after resolving the
 // target college. Hold the persisted actor locks while reading device data.
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
   organizationId:target.college.organizationId,collegeId:target.college.id,
  });
  const result=await tx.execute(sql<{
   id:string;device_name:string|null;user_agent:string|null;ip_address:string|null;
   last_seen_at:Date;created_at:Date;expires_at:Date;
  }>`SELECT id,device_name,user_agent,ip_address,last_seen_at,created_at,expires_at
   FROM identity_device_sessions WHERE user_id=${target.userId}::uuid
   AND revoked_at IS NULL AND expires_at>now()
   ORDER BY last_seen_at DESC,id DESC LIMIT 101 OFFSET ${(page-1)*pageSize}`);
  return {target,devices:result.rows.slice(0,pageSize),page,pageSize,hasMore:result.rows.length>pageSize,truncated:result.rows.length>pageSize};
 });
}

/** Revocation and audit commit in one database transaction. A compromised
 * college admin's sessions across colleges are revoked deliberately. */
export async function revokeCollegeAdminSessions(ctx:RequestContext,collegeId:unknown,userId:unknown){
 const target=await authorizedTarget(ctx,collegeId,userId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
   organizationId:target.college.organizationId,collegeId:target.college.id,
  });
  const rows=await tx.execute(sql<{id:string}>`UPDATE identity_device_sessions
  SET revoked_at=now(),revoked_by_user_id=${ctx.user.id}::uuid,
    revocation_reason='SUPER_ADMIN_SIGN_OUT_EVERYWHERE'
  WHERE user_id=${target.userId}::uuid AND revoked_at IS NULL
    AND expires_at>now() RETURNING id`);
  // The second "sign out everywhere" retry is a no-op: there were no live
  // sessions left to revoke. Do not emit a duplicate lifecycle audit record.
  if(rows.rows.length===0)return {revoked:0,message:"No active sessions."};
  await recordActivityEventInTransaction(tx,ctx,{
   eventType:ACTIVITY_EVENT_TYPES.PLATFORM_ADMIN_SESSIONS_REVOKED,
   organizationId:target.college.organizationId,collegeId:target.college.id,
   subjectType:"user",subjectId:target.userId,subjectLabel:target.name,
   summary:"Super Admin signed out a college administrator everywhere",
   metadata:{revoked:rows.rows.length},
  });
  return {revoked:rows.rows.length,message:"All sessions revoked"};
 });
}

/** SA-tenants-modules-17. Only persisted identity/platform actions with this
 * exact college AND user or membership subject are surfaced; no raw metadata.
 * Actor activity elsewhere and other colleges' membership events are excluded.
 */
export async function listCollegeAdminHistory(ctx:RequestContext,collegeId:unknown,userId:unknown,rawPage:unknown=1){
 const page=adminSessionHistoryPageSchema.parse(rawPage);
 const target=await authorizedTarget(ctx,collegeId,userId);
 // Do not trust a Super Admin role captured before an expired session or
 // role removal. Authorize under SHARE locks until sensitive event data loads.
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
   organizationId:target.college.organizationId,collegeId:target.college.id,
  });
  const rows=await tx.select({
   id:activityEvents.id,eventType:activityEvents.eventType,
   occurredAt:activityEvents.occurredAt,summary:activityEvents.summary,
  }).from(activityEvents)
   .where(and(eq(activityEvents.collegeId,target.college.id),
    inArray(activityEvents.module,["IDENTITY","PLATFORM"]),
    or(eq(activityEvents.subjectId,target.userId),
     eq(activityEvents.subjectId,target.membershipId))))
   .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(101).offset((page-1)*100);
  return {target,events:rows.slice(0,100),page,truncated:rows.length>100};
 });
}
