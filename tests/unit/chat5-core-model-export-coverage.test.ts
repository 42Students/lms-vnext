import {describe,expect,it} from "vitest";
import {tpoDriveCancelImpactSchema} from "@/modules/placements/tpo-drive-cancel-model";
import {tpoDriveImpactCountsSchema} from "@/modules/placements/tpo-drive-close-preview-model";
import {
  matchesTpoSelectionReleaseRevision,tpoSelectionReleaseFailureMessage,
} from "@/modules/placements/tpo-drive-selection-model";

describe("chat-5 exhaustive core model export boundaries",()=>{
 it("PLACEMENTS-COVERAGE-CANCEL-35 refuses missing, negative, fractional or forged impact figures",()=>{
  const valid={submittedApplications:3,openRounds:1,issuedOffers:2,acceptedOffers:1};
  expect(tpoDriveCancelImpactSchema.parse(valid)).toEqual(valid);
  for(const key of Object.keys(valid)){
    const missing={...valid};delete (missing as Partial<typeof valid>)[key as keyof typeof valid];
    expect(tpoDriveCancelImpactSchema.safeParse(missing).success,key).toBe(false);
    for(const value of [-1,0.5,NaN,Infinity,"3"]){
      expect(tpoDriveCancelImpactSchema.safeParse({...valid,[key]:value}).success,key).toBe(false);
    }
  }
  expect(tpoDriveCancelImpactSchema.safeParse({...valid,collegeId:"foreign"}).success).toBe(false);
 });
 it("PLACEMENTS-COVERAGE-CLOSE-36 uses strict nonnegative integer counts, not user-supplied scope",()=>{
  const valid={applications:10,rounds:2,offers:1};
  expect(tpoDriveImpactCountsSchema.parse(valid)).toEqual(valid);
  for(const key of Object.keys(valid)){
    for(const value of [-1,0.1,Infinity,NaN,"1"]){
      expect(tpoDriveImpactCountsSchema.safeParse({...valid,[key]:value}).success,key).toBe(false);
    }
  }
  expect(tpoDriveImpactCountsSchema.safeParse({...valid,otherTenant:true}).success).toBe(false);
  expect(tpoDriveImpactCountsSchema.safeParse({applications:0,rounds:0}).success).toBe(false);
 });
 it("PLACEMENTS-COVERAGE-SELECTION-37 compares the full selection revision by instant, candidate, role and package",()=>{
  const base={recordedAt:new Date("2099-10-18T04:30:00.000Z"),
    applicationId:"app-a",roleTitle:"Engineer",annualCtcInr:900_000};
  const displayed={applicationId:base.applicationId,roleTitle:base.roleTitle,annualCtcInr:base.annualCtcInr};
  expect(matchesTpoSelectionReleaseRevision(base,displayed,"2099-10-18T10:00:00.000+05:30")).toBe(true);
  expect(matchesTpoSelectionReleaseRevision(base,displayed,base.recordedAt.toISOString())).toBe(true);
  expect(matchesTpoSelectionReleaseRevision(base,displayed,"2099-10-18T04:30:00.001Z")).toBe(false);
  expect(matchesTpoSelectionReleaseRevision(base,{...displayed,applicationId:"app-b"},base.recordedAt.toISOString())).toBe(false);
  expect(matchesTpoSelectionReleaseRevision(base,{...displayed,roleTitle:"Senior Engineer"},base.recordedAt.toISOString())).toBe(false);
  expect(matchesTpoSelectionReleaseRevision(base,{...displayed,annualCtcInr:null},base.recordedAt.toISOString())).toBe(false);
  expect(matchesTpoSelectionReleaseRevision({...base,recordedAt:new Date(Number.NaN)},displayed,base.recordedAt.toISOString())).toBe(false);
  expect(matchesTpoSelectionReleaseRevision(base,displayed,"forged token")).toBe(false);
 });
 it("PLACEMENTS-COVERAGE-SELECTION-38 maps stale versions to recovery copy without exposing raw provider errors",()=>{
  expect(tpoSelectionReleaseFailureMessage(new Error("PLACEMENT_JOB_PREVIEW_STALE")))
    .toBe("This selection changed. Refresh before releasing.");
  for(const error of [null,new Error("SQLSTATE 23505: secret provider password"),"Unauthorized",{code:"23505"}]){
    const message=tpoSelectionReleaseFailureMessage(error);
    expect(message).toMatch(/Refresh and try again/);
    expect(message).not.toMatch(/SQLSTATE|password|23505|Unauthorized/);
  }
 });
});
