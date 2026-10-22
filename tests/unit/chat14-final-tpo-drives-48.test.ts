import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoDriveEditSchema,evaluateTpoDriveEdit} from "@/modules/placements/tpo-drive-edit-model";
const read=(p:string)=>readFileSync(p,"utf8");
const valid={
 confirmed:true,expectedUpdatedAt:"2099-01-01T00:00:00Z",reason:"Update location and eligibility",
 title:"Career drive",description:"Updated",locations:["Hyderabad"],openings:4,
 minimumAnnualCtcInr:300000,maximumAnnualCtcInr:500000,fixedCtcLpa:2.5,
 variableCtcLpa:0.5,stipendPerMonthInr:null,isDream:false,
 applicationDeadline:"2099-08-20T11:00:00Z",minCgpaHundredths:700,notifyApplicants:true,
};
describe("chat-14 final sprint",()=>{
 it("TPO-drives-48 allows audited PUBLISHED changes but still blocks CLOSED and inactive seasons",()=>{
  const parsed=tpoDriveEditSchema.parse(valid);
  expect(evaluateTpoDriveEdit("PUBLISHED","ACTIVE",parsed)).toBe("ALLOW");
  expect(evaluateTpoDriveEdit("DRAFT","ACTIVE",parsed)).toBe("ALLOW");
  expect(evaluateTpoDriveEdit("CLOSED","ACTIVE",parsed)).toBe("READ_ONLY");
  // Inactive seasons freeze recruitment, not auditable correction of an
  // otherwise published drive; closed drive state itself stays read-only.
  expect(evaluateTpoDriveEdit("PUBLISHED","CLOSED",parsed)).toBe("ALLOW");
 });
 it("TPO-drives-48 rejects removal of a live deadline and invalid CGPA",()=>{
  expect(evaluateTpoDriveEdit("PUBLISHED","ACTIVE",tpoDriveEditSchema.parse({...valid,applicationDeadline:null}))).toBe("INVALID_DEADLINE");
  expect(tpoDriveEditSchema.safeParse({...valid,minCgpaHundredths:1001}).success).toBe(false);
 });
 it("TPO-drives-48 requires explicit live edit decision and shows actual applicant count",()=>{
  const ui=read("src/components/placements/tpo-drive-edit-form.tsx");
  expect(ui).toContain("Save changes to a live drive?");
  expect(ui).toContain("Save without telling anyone");
  expect(ui).toContain("Save and notify {job.applicantCount} applicants");
  expect(ui).toContain("driveDeadlineIstToIso");
 });
 it("TPO-drives-48 audits updates and notifies only submitted active-college applicants transactionally",()=>{
  const service=read("src/modules/placements/tpo-drive-edit-service.ts");
  expect(service).toContain('inArray(placementJobs.status,["DRAFT","PUBLISHED"])');
  expect(service).toContain("placementJobEligibilityPolicies");
  expect(service).toContain("input.notifyApplicants");
  expect(service).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(service).toContain('eq(collegeMemberships.collegeId,collegeId)');
  expect(service).toContain('tx.insert(inAppNotifications)');
  expect(service).toContain("auditTpoJobChange");
 });
});