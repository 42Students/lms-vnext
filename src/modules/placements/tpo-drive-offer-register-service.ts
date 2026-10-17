import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,collegeMemberships,learnerProfiles,learnerProgramEnrollments,cohorts,programs,departments} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {listPlacementJobOffers} from "./offer-service";
import {requirePlacementManageScope} from "./scope";
import {offerRegisterQuery,projectOfferRegister,tpoDriveOfferRegisterCsv} from "./tpo-drive-offer-register-model";
export async function getTpoDriveOfferRegister(context:RequestContext,raw:unknown){
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 const collegeId=member.collegeId;
 if(!can(context,"placements.manage",{collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId});
 const input=offerRegisterQuery.parse(raw);
 const [job]=await getDb().select({id:placementJobs.id,title:placementJobs.title}).from(placementJobs)
  .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 await requirePlacementManageScope(context,collegeId);
 const facts=await listPlacementJobOffers(context,job.id);
 const membershipIds=[...new Set(facts.map(row=>row.candidate.membershipId))];
 const academic=membershipIds.length?await getDb().select({
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
  eq(collegeMemberships.collegeId,collegeId))):[];
 const academics=new Map<string,(typeof academic)[number]>();
 for(const row of academic){if(!academics.has(row.membershipId))academics.set(row.membershipId,row);}
 const enriched=facts.map(row=>({...row,candidate:{
  ...row.candidate,rollNumber:academics.get(row.candidate.membershipId)?.rollNumber??null,
  batch:academics.get(row.candidate.membershipId)?.batch??null,
  branch:academics.get(row.candidate.membershipId)?.branch??null,
 }}));
 return {job,status:input.status,...projectOfferRegister(enriched,input.status,input.page,input.q,input.joining,new Date(),input.kind)};
}

/** Read-only, scoped export. Does not mark a letter delivered or contact a learner. */
export async function getTpoDriveOfferRegisterCsv(context:RequestContext,raw:unknown){
 const input=offerRegisterQuery.omit({page:true}).parse(raw);
 const scoped=await getTpoDriveOfferRegister(context,{...input,page:1});
 const facts=await listPlacementJobOffers(context,scoped.job.id);
 return tpoDriveOfferRegisterCsv(facts,input);
}
