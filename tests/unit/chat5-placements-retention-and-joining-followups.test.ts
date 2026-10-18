import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {collegeApplicationRetentionCutoff,COLLEGE_APPLICATION_RETENTION_DAYS} from "@/modules/placements/college-retention-report-policy";
import {
 projectTpoJoiningFollowups,tpoJoiningFollowupCsv,tpoJoiningFollowupQuerySchema,
 TPO_JOINING_FOLLOWUP_CSV_LIMIT,
 type JoiningFollowupFact,
} from "@/modules/placements/tpo-joining-followup-model";

const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const today="2099-10-18";
const base:JoiningFollowupFact={
 offerId:"offer-1",jobId:"job-1",jobTitle:"Campus drive",companyName:"Employer",
 candidateName:"=2+2",roleTitle:"Engineer",offerStatus:"ACCEPTED",
 joiningStatus:null,scheduledDate:null,
};
describe("TPO prep derived reader compile and tenant isolation contract",()=>{
 it("TPO-PREP-TSC-01 binds the actual cohorts table, not a local cohort-id string array",()=>{
  const source=src("src/modules/placements/tpo-prep-readiness-derived-service.ts");
  expect(source).toContain("cohorts as cohortTable");
  expect(source).toContain(".innerJoin(cohortTable,eq(cohortTable.id,learnerProgramEnrollments.cohortId))");
  expect(source).toContain("eq(cohortTable.programId,programs.id)");
  expect(source).not.toMatch(/const\s+cohorts\s*=/);
  expect(source).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(source).toContain("eq(departments.collegeId,collegeId)");
  expect(source).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(source).toContain("hasEveryScopedTpoPrepLearner(learners,enrolled)");
 });
});
describe("PLACEMENTS-RETENTION-01 read-only application retention boundary",()=>{
 it("uses exactly the 180-day lookback and refuses malformed clocks",()=>{
  expect(COLLEGE_APPLICATION_RETENTION_DAYS).toBe(180);
  const instant=new Date("2099-10-18T12:00:00.000Z");
  const cutoff=collegeApplicationRetentionCutoff(instant);
  expect(cutoff.getTime()).toBe(instant.getTime()-180*86400000);
  expect(collegeApplicationRetentionCutoff(new Date(cutoff.getTime()+180*86400000))).toEqual(cutoff);
  expect(()=>collegeApplicationRetentionCutoff(new Date(Number.NaN))).toThrow("Invalid retention reference date");
 });
 it("PLACEMENTS-RETENTION-02 keeps every old row college scoped and read-only in the persisted report",()=>{
  const service=src("src/modules/placements/college-retention-report-service.ts");
  expect(service).toContain("requireCollegePlacementAdmin(ctx)");
  expect(service).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(service).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(service).toContain('eq(placementApplications.status,"WITHDRAWN")');
  expect(service).toContain('eq(placementApplicationScreenings.status,"REJECTED")');
  expect(service).toContain("lt(placementApplications.updatedAt,cutoff)");
  expect(service).toContain("lt(sql<Date>");
  expect(service).toContain("coalesce(");
  expect(service).toContain("collegeApplicationRetentionCutoff(new Date())");
  expect(service).toContain("COLLEGE_APPLICATION_RETENTION_DAYS");
  expect(service).toContain(".limit(200)");
  expect(service).toContain("This read-only report never removes application, offer, audit or student records.");
  expect(service).not.toContain(".delete(");
  expect(service).not.toContain("hardDelete");
 });
});

describe("PLACEMENTS-RETENTION-ACTIVE-28 protected official commitments",()=>{
 it("never classifies an old withdrawn/rejected application with issued or accepted offers as disposable",()=>{
  const service=src("src/modules/placements/college-retention-report-service.ts");
  expect(service).toContain("notExists(db.select({id:placementOffers.id}).from(placementOffers)");
  expect(service).toContain("eq(placementOffers.applicationId,placementApplications.id)");
  expect(service).toContain('inArray(placementOffers.status,["ISSUED","ACCEPTED"])');
  expect(service).toContain("requireCollegePlacementAdmin(ctx)");
  expect(service).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(service).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(service).not.toContain(".delete(");
  expect(service).toContain("This read-only report never removes application, offer, audit or student records.");
 });
});

describe("PLACEMENTS-JOINING-FOLLOWUP-01 real-status/date-driven evidence",()=>{
 const rows:JoiningFollowupFact[]=[
  base,
  {...base,offerId:"offer-2",joiningStatus:"PENDING",scheduledDate:"2099-10-18"},
  {...base,offerId:"offer-3",joiningStatus:"DEFERRED",scheduledDate:"2099-10-20"},
  {...base,offerId:"offer-4",joiningStatus:"JOINED",scheduledDate:"2099-10-17"},
  {...base,offerId:"offer-5",joiningStatus:"DID_NOT_JOIN",scheduledDate:"2099-10-16"},
  {...base,offerId:"offer-6",offerStatus:"DECLINED",joiningStatus:"PENDING",scheduledDate:"2099-10-18"},
  {...base,offerId:"offer-2",joiningStatus:"PENDING",scheduledDate:"2099-10-18"},
 ];
 it("counts distinct accepted offer versions only; no date is not automatically overdue",()=>{
  const all=projectTpoJoiningFollowups(rows,today,"ALL");
  expect(all.counts).toEqual({accepted:5,pending:2,deferred:1,joined:1,didNotJoin:1,dueWithRecordedDate:1,dateMissing:1});
  expect(all.rows.map(row=>row.offerId)).toEqual(["offer-2","offer-3","offer-1"]);
  expect(projectTpoJoiningFollowups(rows,today,"DATE_DUE").rows.map(row=>row.offerId)).toEqual(["offer-2"]);
  expect(projectTpoJoiningFollowups(rows,today,"DATE_MISSING").rows.map(row=>row.offerId)).toEqual(["offer-1"]);
  expect(projectTpoJoiningFollowups(rows,today,"UPCOMING_7_DAYS").rows.map(row=>row.offerId)).toEqual(["offer-3"]);
  expect(projectTpoJoiningFollowups(rows,today,"DEFERRED").rows.map(row=>row.offerId)).toEqual(["offer-3"]);
  expect(projectTpoJoiningFollowups(rows,today,"PENDING").rows.map(row=>row.offerId)).toEqual(["offer-2","offer-1"]);
 });
 it("requires exact schema state/season UUID and does not accept unknown filters",()=>{
  expect(tpoJoiningFollowupQuerySchema.safeParse({state:"DATE_MISSING"}).success).toBe(true);
  expect(tpoJoiningFollowupQuerySchema.safeParse({state:"DUE",seasonId:"not-a-uuid"}).success).toBe(false);
  expect(tpoJoiningFollowupQuerySchema.safeParse({state:"PENDING",collegeId:"other"}).success).toBe(false);
 });
 it("PLACEMENTS-JOINING-TRUNC-11 tells the truth when source accepted-offer history was capped",()=>{
  const sample=projectTpoJoiningFollowups(rows,today,"ALL");
  const sourceLimited=tpoJoiningFollowupCsv({...sample,truncated:true},"Large season");
  expect(sourceLimited.truncated).toBe(true);
  expect(sourceLimited.csv).toContain("SOURCE_TRUNCATED");
  expect(sourceLimited.csv).toContain("Summary totals are incomplete");
  expect(sourceLimited.csv).toContain("Only the first 500 accepted offer versions");
  const full=tpoJoiningFollowupCsv(sample,"Small season");
  expect(full.truncated).toBe(false);
  expect(full.csv).not.toContain("SOURCE_TRUNCATED");
  const service=src("src/modules/placements/tpo-joining-followup-service.ts");
  expect(service).toContain("truncated:offers.length>500");
  const route=src("src/app/api/placements/reports/joining-followups/route.ts");
  expect(route).toContain("tpoJoiningFollowupCsv(report,report.season.name)");
 });
 it("never infers JOINED in export, uses formula-neutralized cells and marks large CSV truncation",()=>{
  const projected=projectTpoJoiningFollowups(rows,today,"ALL");
  const result=tpoJoiningFollowupCsv(projected,"Campus placements");
  expect(result.csv).toContain("Joining success requires an explicit JOINED outcome.");
  expect(result.csv).toContain("'=2+2");
  expect(result.csv).toContain("Date unavailable");
  expect(result.truncated).toBe(false);
  const many=Array.from({length:TPO_JOINING_FOLLOWUP_CSV_LIMIT+1},(_,index)=>({
   ...base,offerId:"offer-long-"+index,candidateName:"Learner "+index,
  }));
  const large=tpoJoiningFollowupCsv(projectTpoJoiningFollowups(many,today,"ALL"),"All seasons");
  expect(large.truncated).toBe(true);
  expect(large.csv).toContain("TRUNCATED");
  expect(large.csv).toContain("totals are not limited.");
 });
});
