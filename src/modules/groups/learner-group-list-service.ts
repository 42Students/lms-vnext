import "server-only";
import {and,asc,eq,isNull,or,lte,gt,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {lmsGroups,lmsGroupMembers} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

export type LearnerGroupListItem={
 id:string;name:string;description:string|null;kind:string;
 status:string;memberState:string|null;capacity:number|null;activeCount:number;
 joinOpen:boolean;
};
export async function listLearnerGroups(context:RequestContext,now=new Date()){
 if(!hasMembershipRole(context,"LEARNER")||!context.membership)
  throw new AuthorizationError("academics.read");
 const member=context.membership;
 const rows=await getDb().select({
  id:lmsGroups.id,name:lmsGroups.name,description:lmsGroups.description,
  kind:lmsGroups.kind,status:lmsGroups.status,
  capacity:lmsGroups.capacity,activeCount:lmsGroups.activeCount,
  openFrom:lmsGroups.selfJoinOpenFrom,openUntil:lmsGroups.selfJoinOpenUntil,
  memberState:lmsGroupMembers.state,
 }).from(lmsGroups).leftJoin(lmsGroupMembers,and(
  eq(lmsGroupMembers.groupId,lmsGroups.id),
  eq(lmsGroupMembers.membershipId,member.id),
 )).where(and(eq(lmsGroups.collegeId,member.collegeId),
  eq(lmsGroups.ownerScope,"COLLEGE"),isNull(lmsGroups.deletedAt),
  or(sql`${lmsGroupMembers.state} in ('ACTIVE','WAITLISTED','REQUESTED')`,
   and(eq(lmsGroups.status,"ACTIVE"),lte(lmsGroups.selfJoinOpenFrom,now),
    or(isNull(lmsGroups.selfJoinOpenUntil),gt(lmsGroups.selfJoinOpenUntil,now)))),
 )).orderBy(asc(lmsGroups.name),asc(lmsGroups.id)).limit(200);
 const all:LearnerGroupListItem[]=rows.map(row=>({
  id:row.id,name:row.name,description:row.description,kind:row.kind,
  status:row.status,memberState:row.memberState,capacity:row.capacity,
  activeCount:row.activeCount,
  joinOpen:row.status==="ACTIVE"&&row.openFrom!==null&&row.openFrom<=now&&
    (row.openUntil===null||row.openUntil>now),
 }));
 return {mine:all.filter(group=>["ACTIVE","WAITLISTED","REQUESTED"].includes(group.memberState??"")),
  open:all.filter(group=>group.joinOpen)};
}
