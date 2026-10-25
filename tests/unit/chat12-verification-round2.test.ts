import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {verificationDecisionNotice} from "@/modules/verification/notification-copy";
const src=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");
describe("chat-12 verified TPO verification workflows",()=>{
 it("TPO-requests-verification-22 includes roll number, previous decision and actual evidence counts",()=>{
  const service=src("src/modules/placements/tpo-verification-queue-service.ts");
  const workspace=src("src/components/verification/VerificationWorkspace.tsx");
  for(const x of ["rollNumber:learnerProfiles.rollNumber","decisionNote:profileVerifications.note","submittedMarksheets","verificationAttentionFlags"])expect(service).toContain(x);
  for(const x of ["Roll no.:","Decided by","Reason sent back:","Marksheet completeness"])expect(workspace).toContain(x);
 });
 it("TPO-requests-verification-23 counts the entire filtered college queue independently of paging and orders Waiting oldest first",()=>{
  const service=src("src/modules/placements/tpo-verification-queue-service.ts");
  expect(service).toContain("groupBy(profileVerifications.status)");
  expect(service).toContain("query?.tab===\"WAITING\"?asc(profileVerifications.submittedAt)");
  expect(service).toContain("counts.WAITING+=item.total");
  expect(src("src/components/verification/TpoVerificationPanel.tsx")).toContain("counts !== undefined ? {counts} : {}");
 });
 it("TPO-requests-verification-24 provides Waiting-update shortcut alongside all the server-side filters",()=>{
  const panel=src("src/components/verification/TpoVerificationPanel.tsx");
  const page=src("src/app/(authenticated)/tpo/verification/page.tsx");
  expect(panel).toContain("Updates to verified details");
  for(const name of ['name="waitingSince"','name="waitingState"','name="batchId"','name="branchId"','name="search"'])expect(page).toContain(name);
 });
 it("TPO-requests-verification-26 has bulk verify and send-back, reason checks and document safeguards",()=>{
  const control=src("src/components/tpo/tpo-roster-verification-bulk.tsx");
  expect(control).toContain('"VERIFY"|"SEND_BACK"');
  expect(control).toContain("!row.missingMarksheet&&!row.missingIdentityProof");
  expect(control).toContain("reason.trim().length<3");
  expect(control).toContain("collegeBulkReviewPayload");
  expect(src("src/app/api/tpo/verification/bulk-review/route.ts")).toContain("reviewTpoVerificationBulk");
 });
 it("TPO-requests-verification-29 provides history, roll, education table, private resume and masked-number explanation",()=>{
  const drawer=src("src/components/verification/VerificationReviewDrawer.tsx");
  for(const text of ['aria-label="Verification history"',"Numbers show only the last four digits","Education","RESUME","Private supporting documents"])expect(drawer).toContain(text);
  expect(drawer).toContain('title={row.learnerName+(row.rollNumber?" · "+row.rollNumber:"")}');
 });
 it("TPO-requests-verification-30 uses exact legacy decision notifications with a reviewer name and correction reason",()=>{
  expect(verificationDecisionNotice({section:"EDUCATION",action:"VERIFIED",reviewerName:"Priya",reason:null}))
   .toEqual({title:"Your education is verified",body:"Verified by Priya. Companies and the placement cell now see it as verified."});
  expect(verificationDecisionNotice({section:"IDENTITY",action:"SENT_BACK",reviewerName:null,reason:"Wrong document"}))
   .toEqual({title:"Your identity needs a change",body:"Wrong document Fix it on your profile and send it again."});
  expect(src("src/modules/profile-verification/transaction-writer.ts")).toContain("verificationDecisionNotice({");
 });
 it("TPO-requests-verification-32 exports each authorized TPO verification status view across bounded pages",()=>{
  const route=src("src/app/api/tpo/verification/export/route.ts");
  const service=src("src/modules/verification/tpo-queue-export-read-service.ts");
  expect(route).toContain("readTpoVerificationExport");
  expect(service).toContain("for(let page=1;page<=11;page++)");
  expect(service).toContain("getTpoVerificationQueue(context");
  expect(src("src/app/(authenticated)/tpo/verification/page.tsx")).toContain('"/api/tpo/verification/export?"');
 });
});
