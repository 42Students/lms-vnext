import "server-only";
import {and,eq,isNull,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {lmsGroups,lmsGroupMembers} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
export const learnerGroupKindSchema=z.string().regex(/^[A-Z][A-Z0-9_]{0,39}$/);
export async function getLearnerGroupDetail(context:RequestContext,rawGroupId:unknown,
 now=new Date()){
 const id=z.uuid().parse(rawGroupId);
 if(!hasMembershipRole(context,"LEARNER")||!context.membership)
  throw new AuthorizationError("academics.read");
 const member=context.membership;
 const [group]=await getDb().select({
  id:lmsGroups.id,name:lmsGroups.name,description:lmsGroups.description,
  kind:lmsGroups.kind,status:lmsGroups.status,capacity:lmsGroups.capacity,
  activeCount:lmsGroups.activeCount,ownerScope:lmsGroups.ownerScope,
  memberState:lmsGroupMembers.state,
  openFrom:lmsGroups.selfJoinOpenFrom,openUntil:lmsGroups.selfJoinOpenUntil,
 }).from(lmsGroups).leftJoin(lmsGroupMembers,and(
   eq(lmsGroupMembers.groupId,lmsGroups.id),
   eq(lmsGroupMembers.membershipId,member.id)))
  .where(and(eq(lmsGroups.id,id),isNull(lmsGroups.deletedAt),
   or(and(eq(lmsGroups.ownerScope,"COLLEGE"),
      eq(lmsGroups.collegeId,member.collegeId)),
      and(eq(lmsGroups.ownerScope,"PLATFORM"),isNull(lmsGroups.collegeId))),
   or(sql`${lmsGroupMembers.state} in ('ACTIVE','WAITLISTED','REQUESTED')`,
      and(eq(lmsGroups.status,"ACTIVE"),
       sql`${lmsGroups.selfJoinOpenFrom} <= ${now}`,
       or(isNull(lmsGroups.selfJoinOpenUntil),sql`${lmsGroups.selfJoinOpenUntil} > ${now}`)))))
  .limit(1);
 if(!group)return null;
 return {
  id:group.id,name:group.name,description:group.description,
  kind:group.kind,status:group.status,memberState:group.memberState,
  capacity:group.capacity,activeCount:group.activeCount,
  joinOpen:group.status==="ACTIVE"&&group.openFrom!==null&&group.openFrom<=now&&
    (group.openUntil===null||group.openUntil>now),
  ownerScope:group.ownerScope,
 };
}
