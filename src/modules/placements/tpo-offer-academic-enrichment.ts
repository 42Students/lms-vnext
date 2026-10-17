import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,learnerProgramEnrollments,
 cohorts,programs,departments} from "@/db/schema";
import type {listPlacementJobOffers} from "./offer-service";

/** TPO-drive-workspace-49: one identical academic projection for grid and CSV. */
export async function enrichTpoOfferFacts(
 facts:Awaited<ReturnType<typeof listPlacementJobOffers>>,collegeId:string,
){
 const membershipIds=[...new Set(facts.map(row=>row.candidate.membershipId))];
 if(!membershipIds.length)return facts.map(row=>({...row,candidate:{
  ...row.candidate,rollNumber:null,batch:null,branch:null,
 }}));
 const academic=await getDb().select({
  membershipId:collegeMemberships.id,rollNumber:learnerProfiles.rollNumber,
  batch:cohorts.name,branch:departments.name,
 }).from(collegeMemberships)
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .leftJoin(learnerProgramEnrollments,and(
  eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
  eq(learnerProgramEnrollments.status,"ACTIVE")))
 .leftJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
 .leftJoin(programs,eq(programs.id,cohorts.programId))
 .leftJoin(departments,and(eq(departments.id,programs.departmentId),
  eq(departments.collegeId,collegeId)))
 .where(and(inArray(collegeMemberships.id,membershipIds),
  eq(collegeMemberships.collegeId,collegeId)));
 const academics=new Map<string,(typeof academic)[number]>();
 for(const row of academic){if(!academics.has(row.membershipId))academics.set(row.membershipId,row);}
 return facts.map(row=>({...row,candidate:{
  ...row.candidate,rollNumber:academics.get(row.candidate.membershipId)?.rollNumber??null,
  batch:academics.get(row.candidate.membershipId)?.batch??null,
  branch:academics.get(row.candidate.membershipId)?.branch??null,
 }}));
}
