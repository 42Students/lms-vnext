import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {collegeMemberships,users,facultyProfiles,learnerProfiles} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeRoleDirectory} from "./college-role-directory-service";
import {escapeRoleDirectoryCsvCell} from "./college-role-directory-export";
import {collegeRoleDirectoryQuerySchema,type CollegeDirectoryKind} from "./college-role-directory-model";

function gender(document:Record<string,unknown>|null){
 const detail=document?.personalDetails;
 return detail && typeof detail==="object" && "gender" in detail &&
  typeof detail.gender==="string"?detail.gender:"";
}
export async function exportVisibleCollegePeople(
 context:RequestContext,kind:CollegeDirectoryKind,raw:unknown){
 const query=collegeRoleDirectoryQuerySchema.parse(raw);
 const data=await listCollegeRoleDirectory(context,kind,query);
 const ids=data.items.map(x=>x.membershipId);
 // Revalidate the actor after the directory read: a revoked membership or
 // account can race an export between list pagination and private detail
 // enrichment. Locks remain held through the enrichment query.
 const persons=ids.length?await getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"people.manage",{
   collegeId:context.membership!.collegeId,
   organizationId:context.membership!.organizationId,
  });
  return tx.select({
  id:collegeMemberships.id,phone:users.phoneE164,
  facultyType:facultyProfiles.employmentType,
  facultyDocument:facultyProfiles.profileDocument,
  learnerDocument:learnerProfiles.profileDocument,
  learnerRoll:learnerProfiles.rollNumber,
 }).from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
  .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(collegeMemberships.collegeId,context.membership!.collegeId),
   inArray(collegeMemberships.id,ids)));
 }):[];
 const details=new Map(persons.map(p=>[p.id,p]));
 const columns=kind==="FACULTY"
  ?["Name","Mobile","Email","Type","Gender","Status"]
  :["Name","Roll Number","Mobile","Email","Program","Batch","Class","Status"];
 const rows=data.items.map(item=>{
  const person=details.get(item.membershipId);
  return kind==="FACULTY"
   ?[item.name,person?.phone??"",item.email??"",person?.facultyType??"",
      gender(person?.facultyDocument??null),item.membershipStatus]
   :[item.name,person?.learnerRoll??"","",item.email??"",item.program??"",
      item.cohort??"",item.sections.join("; "),item.membershipStatus];
 });
 return {csv:"\uFEFF"+[columns,...rows].map(row=>row.map(value=>
  escapeRoleDirectoryCsvCell(String(value??""))).join(",")).join("\r\n")+"\r\n",
  total:data.total,shown:rows.length,page:data.filter.page};
}
