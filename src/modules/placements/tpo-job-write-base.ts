import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
type Db=ReturnType<typeof getDb>;
export type TpoJobTx=Parameters<Parameters<Db["transaction"]>[0]>[0];
export async function requireTpoJobCollege(context:RequestContext){
 const member=context.membership;
 if(!member||!(hasMembershipRole(context,"TPO")||hasMembershipRole(context,"COLLEGE_ADMIN"))||member.status!=="ACTIVE"||
   context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 const collegeId=member.collegeId;
 if(!can(context,"placements.manage",{collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId});
 await requirePlacementManageScope(context,collegeId);
 return collegeId;
}
export async function requireTpoJobActor(tx:TpoJobTx,context:RequestContext){
 const member=context.membership;
 if(!member)throw new AuthorizationError("placements.manage");
 const [principal]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
 .where(and(eq(collegeMemberships.id,member.id),eq(collegeMemberships.collegeId,member.collegeId),
   eq(collegeMemberships.userId,context.user.id),eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!principal)throw new AuthorizationError("placements.manage");
}
export async function auditTpoJobChange(tx:TpoJobTx,context:RequestContext,
 job:{id:string;title:string},eventType:string,action:string,metadata:Record<string,unknown>){
 const member=context.membership;
 if(!member)throw new AuthorizationError("placements.manage");
 await tx.insert(activityEvents).values({organizationId:member.organizationId,
   collegeId:member.collegeId,actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PLACEMENTS",eventType,subjectType:"placement_job",subjectId:job.id,
   summary:"TPO "+action+" drive "+job.title,metadata,occurredAt:new Date()});
}
