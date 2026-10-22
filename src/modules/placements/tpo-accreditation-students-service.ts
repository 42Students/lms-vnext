import "server-only";
import {and,asc,eq,inArray,isNotNull,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {cohorts,collegeMemberships,departments,learnerProfiles,learnerProgramEnrollments,
 placementApplications,placementCompanies,placementCompanyRelationships,placementJobs,
 placementJoiningOutcomes,placementOffers,placementCollegeRules,placementDriveSelections,placementTpoLeads,programs,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {getPlacementAccreditationReport} from "./report-accreditation-service";
import {tpoCrmTablesReady} from "./tpo-crm-storage-readiness";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {accreditationStudentCsv,buildAccreditationStudentRows,ACCREDITATION_STUDENT_WARNING} from "./tpo-accreditation-students-model";

/** Server-checked one-college/one-batch evidence. A blank employer contact is
 * intentional: no vetted employer contact is attached to the registered
 * placement company schema, and student phone/email is not a substitute. */
export async function getTpoAccreditationStudentExport(context:RequestContext,raw:unknown){
 const query=z.strictObject({collegeId:z.string().uuid(),batchId:z.string().uuid(),
  seasonId:z.string().uuid().optional(),jobId:z.string().uuid().optional()}).parse(raw);
 const {collegeId,batch}=await getTpoBatch(context,query.batchId);
 if(collegeId!==query.collegeId)throw Error("BATCH_COLLEGE_MISMATCH");
 requirePermission(context,"placements.manage",{collegeId:query.collegeId,...(context.membership?.organizationId!==undefined?{organizationId:context.membership.organizationId}:{})});
 const report=await getPlacementAccreditationReport(context,{collegeId,
  ...(query.seasonId!==undefined?{seasonId:query.seasonId}:{}),
  ...(query.jobId!==undefined?{jobId:query.jobId}:{}),
 });
 if(!report.selectedSeasonId){
  const rows=buildAccreditationStudentRows([]);
  return {rows,csv:accreditationStudentCsv(rows),batch,warning:ACCREDITATION_STUDENT_WARNING};
 }
 const [rules]=await getDb().select({countsAsPlacedAt:placementCollegeRules.countsAsPlacedAt})
  .from(placementCollegeRules).where(eq(placementCollegeRules.collegeId,collegeId)).limit(1);
 const countsAsPlacedAt=(rules?.countsAsPlacedAt??"OFFER_RELEASED") as "SELECTED"|"OFFER_RELEASED"|"OFFER_ACCEPTED";
 const offers=await getDb().select({
  membershipId:collegeMemberships.id,offerId:placementOffers.id,name:users.displayName,
  rollNumber:learnerProfiles.rollNumber,programme:programs.name,branch:departments.name,
  batch:cohorts.name,company:placementCompanies.name,companyRelationshipId:placementCompanyRelationships.id,
  status:placementOffers.status,kind:placementOffers.kind,releasedAt:placementOffers.releasedAt,
  countsAsPlaced:placementJobs.countsAsPlaced,
  annualCtcInr:placementOffers.annualCtcInr,joining:placementJoiningOutcomes.status,
 }).from(placementOffers)
  .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId)))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(learnerProgramEnrollments,and(
   eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
   eq(learnerProgramEnrollments.cohortId,query.batchId)))
  .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
  .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),
   eq(departments.collegeId,collegeId)))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
  .where(and(eq(placementJobs.collegeId,collegeId),
   eq(placementJobs.seasonId,report.selectedSeasonId),
   eq(placementJobs.countsAsPlaced,true),isNull(placementJobs.archivedAt),
   query.jobId?eq(placementJobs.id,query.jobId):undefined));
 const selectionRows=countsAsPlacedAt==="SELECTED"?await getDb().select({
  membershipId:collegeMemberships.id,selectionId:placementDriveSelections.id,name:users.displayName,
  rollNumber:learnerProfiles.rollNumber,programme:programs.name,branch:departments.name,
  batch:cohorts.name,company:placementCompanies.name,companyRelationshipId:placementCompanyRelationships.id,
  annualCtcInr:placementDriveSelections.annualCtcInr,
  countsAsPlaced:placementJobs.countsAsPlaced,
 }).from(placementDriveSelections)
  .innerJoin(placementApplications,eq(placementApplications.id,placementDriveSelections.applicationId))
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementDriveSelections.jobId),
   eq(placementJobs.id,placementApplications.jobId)))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId)))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(learnerProgramEnrollments,and(
   eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
   eq(learnerProgramEnrollments.cohortId,query.batchId)))
  .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
  .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),
   eq(departments.collegeId,collegeId)))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(placementJobs.collegeId,collegeId),
   eq(placementJobs.seasonId,report.selectedSeasonId),
   eq(placementJobs.countsAsPlaced,true),
   inArray(placementDriveSelections.status,["SELECTED","VERIFIED","RELEASED"]),
   isNull(placementJobs.archivedAt),
   query.jobId?eq(placementJobs.id,query.jobId):undefined)):[];

 const contactRows=await tpoCrmTablesReady()?await getDb().select({
  relationshipId:placementTpoLeads.companyRelationshipId,email:placementTpoLeads.emailNorm,
 }).from(placementTpoLeads).where(and(eq(placementTpoLeads.collegeId,collegeId),
  isNotNull(placementTpoLeads.emailNorm),isNotNull(placementTpoLeads.companyRelationshipId)))
  .orderBy(asc(placementTpoLeads.createdAt),asc(placementTpoLeads.id)):[];
 const employerContacts=new Map<string,string>();
 for(const row of contactRows){if(row.relationshipId&&row.email&&!employerContacts.has(row.relationshipId))
  employerContacts.set(row.relationshipId,row.email);}
 const students=[...offers.map(row=>({...row,employerContact:employerContacts.get(row.companyRelationshipId)??null})),
  ...selectionRows.map(row=>({...row,employerContact:employerContacts.get(row.companyRelationshipId)??null,offerId:"selection:"+row.selectionId,
  status:"SELECTED",kind:"OFFER",joining:null,selectedOutcome:true}))];
 const rows=buildAccreditationStudentRows(students,countsAsPlacedAt);
 return {rows,csv:accreditationStudentCsv(rows),batch,warning:ACCREDITATION_STUDENT_WARNING};
}
