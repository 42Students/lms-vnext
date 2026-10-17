import "server-only";
import {and,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges} from "@/db/schema/colleges";
import {collegeMemberships,membershipRoles} from "@/db/schema/memberships";
import {users} from "@/db/schema/users";
import {deliverInAppNotificationInTransaction} from "@/modules/activity/notification-service";
import {organizations} from "@/db/schema/organizations";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {activityEvents} from "@/db/schema/activity";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {AnnouncementError} from "./errors";
import {canAccessAnnouncements} from "./actor-status-model";
import {superAdminCollegeBroadcastSchema,requestedBroadcastCollegeIds,sameReviewedBroadcastAudience} from "./super-admin-college-broadcast-model";
/** Scoped active-college directory independent of the single-college announcement composer. */
export async function listSuperAdminBroadcastColleges(context:RequestContext){
 if(!isSuperAdmin(context)||!canAccessAnnouncements(context.user.platformStatus))throw new AuthorizationError("college.read");
 requirePermission(context,"admin-scope.select");
 const conditions=[
  eq(colleges.status,"ACTIVE"),
  eq(organizations.status,"ACTIVE"),
  // Only active colleges with an active TPO membership receive placement-cell notices.
  sql`exists(select 1 from college_memberships cm join membership_roles mr
    on mr.membership_id=cm.id join users u on u.id=cm.user_id
    where cm.college_id=${colleges.id} and cm.status='ACTIVE'
      and u.platform_status='ACTIVE' and mr.role='TPO')`,
  ...(context.adminScope?.collegeId?[eq(colleges.id,context.adminScope.collegeId)]:[]),
  ...(context.adminScope?.organizationId?[eq(colleges.organizationId,context.adminScope.organizationId)]:[]),
 ];
 const rows=await getDb().select({
  id:colleges.id,label:colleges.name,organizationId:colleges.organizationId,
 }).from(colleges).innerJoin(organizations,eq(organizations.id,colleges.organizationId))
  .where(and(...conditions)).orderBy(colleges.name,colleges.id).limit(501);
 if(rows.length>500)throw new AnnouncementError("TARGET_NOT_FOUND");
 for(const row of rows)requirePermission(context,"college.read",{collegeId:row.id,organizationId:row.organizationId});
 return rows.map(row=>({id:row.id,label:row.label}));
}
/** Creates one persisted DB10 recipient-scoped notice per college; no external delivery. */
export async function publishSuperAdminCollegeBroadcast(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context)||!canAccessAnnouncements(context.user.platformStatus))throw new AuthorizationError("college.manage");
 requirePermission(context,"admin-scope.select");
 const input=superAdminCollegeBroadcastSchema.parse(raw);
 const requested=requestedBroadcastCollegeIds(input.collegeIds);
 const db=getDb();
 const restrictions=[
  eq(colleges.status,"ACTIVE"),
  eq(organizations.status,"ACTIVE"),
  // Only active colleges with an active TPO membership receive placement-cell notices.
  sql`exists(select 1 from college_memberships cm join membership_roles mr
    on mr.membership_id=cm.id join users u on u.id=cm.user_id
    where cm.college_id=${colleges.id} and cm.status='ACTIVE'
      and u.platform_status='ACTIVE' and mr.role='TPO')`,
  ...(context.adminScope?.collegeId?[eq(colleges.id,context.adminScope.collegeId)]:[]),
  ...(context.adminScope?.organizationId?[eq(colleges.organizationId,context.adminScope.organizationId)]:[]),
  ...(input.audienceMode==="SELECTED_COLLEGES"?[inArray(colleges.id,requested)]:[]),
 ];
 const targets=await db.select({id:colleges.id,organizationId:colleges.organizationId})
  .from(colleges).innerJoin(organizations,eq(organizations.id,colleges.organizationId))
  .where(and(...restrictions)).orderBy(colleges.id).limit(501);
 if(targets.length===0||targets.length>500)throw new AnnouncementError("TARGET_NOT_FOUND");
 if(input.reviewedCollegeIds && !sameReviewedBroadcastAudience(input.reviewedCollegeIds,targets.map(row=>row.id)))
  throw new AnnouncementError("STALE_AUDIENCE");
 if(input.audienceMode==="SELECTED_COLLEGES"&&targets.length!==requested.length)throw new AnnouncementError("TARGET_NOT_FOUND");
 for(const target of targets){
  requirePermission(context,"college.manage",{organizationId:target.organizationId,collegeId:target.id});
 }
 const created=await db.transaction(async tx=>{
  const rows=targets.map(target=>({
   organizationId:target.organizationId,collegeId:target.id,
   receiverType:"COLLEGE",receiverId:target.id,
   title:input.title,message:input.message,
   buttonLabel:input.buttonLabel||null,buttonUrl:input.buttonUrl||null,
   senderUserId:context.user.id,senderType:"SUPER_ADMIN",
   scheduledAt:input.scheduledAt?new Date(input.scheduledAt):null,
   expiresAt:input.expiresAt?new Date(input.expiresAt):null,
   isPinned:input.isPinned,
  }));
  const inserted=await tx.insert(db10Announcements).values(rows).returning({id:db10Announcements.id,collegeId:db10Announcements.collegeId});
  const organizationsByCollege=new Map(targets.map(target=>[target.id,target.organizationId]));
  const events=await tx.insert(activityEvents).values(inserted.map(row=>({
   collegeId:row.collegeId,organizationId:organizationsByCollege.get(row.collegeId)!,
   actorUserId:context.user.id,module:"PLATFORM" as const,
   eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_ANNOUNCEMENT_PUBLISHED,
   subjectType:"announcement",subjectId:row.id,
   importance:"HIGH" as const,summary:"Super Admin published an in-app college notice",
   metadata:{audienceMode:input.audienceMode,noticeId:row.id},
  }))).returning({id:activityEvents.id,collegeId:activityEvents.collegeId});
  // Immediate notices notify every ACTIVE TPO user of the college. Scheduled
  // notices remain passive until the scheduled-delivery worker is configured.
  if(!input.scheduledAt||new Date(input.scheduledAt).getTime()<=Date.now()){
   const recipients=await tx.select({collegeId:collegeMemberships.collegeId,userId:collegeMemberships.userId})
    .from(collegeMemberships)
    .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(
     inArray(collegeMemberships.collegeId,targets.map(row=>row.id)),
     eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,"TPO"),
     eq(users.platformStatus,"ACTIVE"),
    )).limit(10001);
   if(recipients.length>10000)throw new AnnouncementError("TARGET_NOT_FOUND");
   const byCollege=new Map<string,string[]>();
   for(const row of recipients)byCollege.set(row.collegeId,[...(byCollege.get(row.collegeId)??[]),row.userId]);
   for(const event of events){
    if(!event.collegeId)continue;
    await deliverInAppNotificationInTransaction(tx,event.id,byCollege.get(event.collegeId)??[],{
     title:"From 42: "+input.title.slice(0,220),body:input.message.slice(0,2000),
     actionHref:"/tpo/announcements",
    });
   }
  }
  return inserted;
 });
 return {count:created.length,noticeIds:created.map(x=>x.id)};
}
