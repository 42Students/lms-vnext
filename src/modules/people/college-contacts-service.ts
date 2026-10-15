import "server-only";
import {and,asc,count,desc,eq,exists,gte,ilike,inArray,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {visibleContactDetails} from "./college-contacts-privacy";
import {collegeContactsQuerySchema,contactsIstDayStart} from "./college-contacts-model";

export type CollegeContactRow={
 membershipId:string;name:string;email:string;phone:string;roles:("FACULTY"|"LEARNER")[];
 status:"ACTIVE"|"SUSPENDED"|"ENDED";joinedAt:Date;
};
export async function listCollegeContacts(context:RequestContext,raw:unknown){
 const filter=collegeContactsQuerySchema.parse(raw);
 const claim=context.membership;
 if(!claim||claim.status!=="ACTIVE"||!claim.roles.includes("COLLEGE_ADMIN"))
  throw new AuthorizationError("people.manage");
 return getDb().transaction(async tx=>{
  const checked=await assertPersistedPlatformPermission(tx,context,"people.manage",{
   organizationId:claim.organizationId,collegeId:claim.collegeId,
  });
  if(!checked.membership||checked.membership.id!==claim.id||
     !checked.membership.roles.includes("COLLEGE_ADMIN")||
     checked.membership.collegeId!==claim.collegeId)
   throw new AuthorizationError("people.manage");
  const hasRole=(role:"FACULTY"|"LEARNER")=>exists(
   tx.select({roleId:membershipRoles.id}).from(membershipRoles).where(and(
    eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,role))));
  const faculty=hasRole("FACULTY"),learner=hasRole("LEARNER");
  const search=filter.q?"%"+filter.q.replace(/[\\%_]/g,"\\$&")+"%":null;
  const matches=and(eq(collegeMemberships.collegeId,claim.collegeId),
   filter.tab==="FACULTY"?faculty:filter.tab==="STUDENT"?learner:or(faculty,learner),
   filter.status==="ALL"?undefined:eq(collegeMemberships.status,filter.status),
   filter.initial?ilike(users.displayName,filter.initial+"%"):undefined,
   filter.joinedFrom?gte(collegeMemberships.createdAt,contactsIstDayStart(filter.joinedFrom)):undefined,
   filter.accountStatus==="ALL"?undefined:eq(users.platformStatus,filter.accountStatus),
   filter.audience==="FACULTY_ONLY"?and(faculty,sql`not (${learner})`):
   filter.audience==="LEARNER_ONLY"?and(learner,sql`not (${faculty})`):
   filter.audience==="DUAL"?and(faculty,learner):undefined,
   search?or(
    ilike(users.displayName,search),
    // Only staff who are not also learners may be located by email.
    // A masked learner contact must not become guessable via search queries.
    and(faculty,sql`not (${learner})`,ilike(users.email,search))
   ):undefined);
  const [countRow]=await tx.select({total:count()}).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(matches);
  const order=filter.sort==="NEWEST"
   ?[desc(collegeMemberships.createdAt),asc(collegeMemberships.id)]
   :filter.sort==="OLDEST"
   ?[asc(collegeMemberships.createdAt),asc(collegeMemberships.id)]
   :filter.sort==="NAME_DESC"
   ?[desc(sql`lower(coalesce(${users.displayName}, ''))`),asc(collegeMemberships.id)]
   :[asc(sql`lower(coalesce(${users.displayName}, ''))`),asc(collegeMemberships.id)];
  const rows=await tx.select({
   membershipId:collegeMemberships.id,name:users.displayName,email:users.email,
   phone:users.phoneE164,status:collegeMemberships.status,joinedAt:collegeMemberships.createdAt,
  }).from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(matches).orderBy(...order).limit(filter.pageSize)
   .offset((filter.page-1)*filter.pageSize);
  const roles=rows.length?await tx.select({membershipId:membershipRoles.membershipId,role:membershipRoles.role})
   .from(membershipRoles).where(and(inArray(membershipRoles.membershipId,rows.map(r=>r.membershipId)),
    inArray(membershipRoles.role,["FACULTY","LEARNER"]))):[];
  const roleMap=new Map<string,("FACULTY"|"LEARNER")[]>();
  for(const role of roles){
   const current=roleMap.get(role.membershipId)??[];
   current.push(role.role as "FACULTY"|"LEARNER");roleMap.set(role.membershipId,current);
  }
  const items:CollegeContactRow[]=rows.map(row=>{
   const memberRoles=roleMap.get(row.membershipId)??[];
   const contact=visibleContactDetails({email:row.email,phone:row.phone,isLearner:memberRoles.includes("LEARNER")});
   return {membershipId:row.membershipId,name:row.name?.trim()||"Unnamed person",
    email:contact.email,phone:contact.phone,roles:memberRoles,
    status:row.status,joinedAt:row.joinedAt};
  });
  return {items,total:countRow?.total??0,filter,pageSize:filter.pageSize};
 });
}
