import "server-only";
import {and,asc,eq,exists,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,users,membershipRoles,learnerProgramEnrollments,
 programs,departments,sectionEnrollments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoJobCollege} from "./tpo-job-write-base";

const uuid=z.string().uuid();
export const draftDriveReachSchema=z.strictObject({
 programIds:z.array(uuid).max(100).default([]),
 cohortIds:z.array(uuid).max(100).default([]),
 sectionIds:z.array(uuid).max(100).default([]),
});
/** Read-only audience estimate before a draft exists. NEVER label as full
 * eligibility: CGPA, grades, backlogs, debarment and held-offer rules require
 * a saved job evaluated by the canonical policy service.
 */
export async function previewDraftDriveTargeting(context:RequestContext,raw:unknown){
 const input=draftDriveReachSchema.parse(raw);
 const collegeId=await requireTpoJobCollege(context);
 const db=getDb();
 const rows=await db.selectDistinct({
  membershipId:collegeMemberships.id,programId:programs.id,programName:programs.name,
 }).from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
   eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE")))
  .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),
   eq(departments.collegeId,collegeId)))
  .where(and(
   eq(learnerProgramEnrollments.status,"ACTIVE"),
   input.programIds.length?inArray(programs.id,input.programIds):undefined,
   input.cohortIds.length?inArray(learnerProgramEnrollments.cohortId,input.cohortIds):undefined,
   input.sectionIds.length?exists(
    db.select({id:sectionEnrollments.id}).from(sectionEnrollments).where(and(
     eq(sectionEnrollments.learnerEnrollmentId,learnerProgramEnrollments.id),
     eq(sectionEnrollments.status,"ACTIVE"),
     inArray(sectionEnrollments.sectionId,input.sectionIds),
    ))
   ):undefined,
  )).orderBy(asc(programs.name),asc(collegeMemberships.id)).limit(10001);
 if(rows.length>10000)return {kind:"UNAVAILABLE" as const,
  reason:"More than 10,000 active enrollment records. Choose narrower targets for a complete estimate."};
 const unique=new Set(rows.map(row=>row.membershipId));
 const branchCount=new Map<string,{name:string;programId:string;members:Set<string>}>();
 for(const row of rows){
  const current=branchCount.get(row.programId)??{
   name:row.programName,programId:row.programId,members:new Set<string>(),
  };
  current.members.add(row.membershipId);
  branchCount.set(row.programId,current);
 }
 return {kind:"READY" as const,activeLearners:unique.size,
  branches:[...branchCount.values()].map(entry=>({
   programId:entry.programId,name:entry.name,total:entry.members.size,
  })).sort((a,b)=>a.name.localeCompare(b.name)),
  scopeNote:"Preliminary academic targeting only; not final placement eligibility. Save the draft to calculate CGPA, grade, verification and placement-policy outcomes.",
 };
}
