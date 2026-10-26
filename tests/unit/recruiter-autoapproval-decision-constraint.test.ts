import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("Recruiter drive auto-approval audit consistency",()=>{
 it("does not assign a human-decision timestamp without a human decision maker",()=>{
  const schema=source("src/db/schema/placement-drive-requests.ts");
  const service=source("src/modules/placements/recruiter-drive-request-service.ts");
  expect(schema).toContain("placement_recruiter_drive_requests_decision_ck");
  expect(service).toMatch(/status:"DRAFT",approvedJobId,updatedAt:new Date\(\),[\s\S]*?decisionNote:null,decidedAt:null,decidedByUserId:null,/);
  expect(service).toContain('approvedJobId?"AUTO_APPROVED":"NEW"');
  // The approved job is a DRAFT; separate placement-cell publication remains required.
  expect(service).toContain("createRecruiterApprovedDraftJob");
 });
});
