import "server-only";
import {and,eq,inArray,isNull,ne} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectMembers} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {loadClassTeamRoster,requireTeamCreationAuthority} from "./class-team-roster-service";
/** COL-projects-06: count the full persisted cohort, never a paged browser roster. */
export async function getCohortCreationPreflight(context:RequestContext,raw:unknown){
 const input=z.strictObject({collegeId:z.string().uuid(),classId:z.string().uuid(),
   templateId:z.string().uuid()}).parse(raw);
 const college=await requireTeamCreationAuthority(context,input.collegeId);
 const roster=await loadClassTeamRoster(context,college.id,input.classId);
 const ids=roster.members.map(member=>member.membershipId);
 if(!ids.length)return {toCreate:0,alreadyCovered:0,eligible:0,duplicates:0,items:[]};
 const covered=await getDb().select({membershipId:projectMembers.membershipId})
  .from(projectMembers).innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
  .where(and(eq(projectInstances.collegeId,college.id),eq(projectInstances.sectionId,input.classId),
   eq(projectInstances.templateId,input.templateId),ne(projectInstances.status,"ARCHIVED"),
   eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt),
   inArray(projectMembers.membershipId,ids)));
 const seen=new Set(covered.map(row=>row.membershipId));
 const encountered=new Set<string>();
 const items=roster.members.map(member=>{
  const membershipId=member.membershipId;
  if(encountered.has(membershipId))return {membershipId,status:"DUPLICATE" as const};
  encountered.add(membershipId);
  return {membershipId,status:seen.has(membershipId)?"ALREADY_COVERED" as const:"TO_CREATE" as const};
 });
 return {toCreate:items.filter(row=>row.status==="TO_CREATE").length,
  alreadyCovered:items.filter(row=>row.status==="ALREADY_COVERED").length,
  eligible:encountered.size,duplicates:items.filter(row=>row.status==="DUPLICATE").length,items};
}
