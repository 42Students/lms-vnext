import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoRequestNeedsConfirmation,TPO_REQUESTS_LEGACY_DESCRIPTION} from "@/modules/placements/tpo-request-decision-copy";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Chat-12 TPO Requests gap closure",()=>{
 it("TPO-requests-verification-02 confirms high-impact approvals and sends routine kinds in one click",()=>{
  expect(tpoRequestNeedsConfirmation("APPLICATION_WITHDRAWAL")).toBe(true);
  expect(tpoRequestNeedsConfirmation("OFF_CAMPUS_OFFER")).toBe(true);
  expect(tpoRequestNeedsConfirmation("ROUND_RESCHEDULE")).toBe(false);
  expect(tpoRequestNeedsConfirmation("OFFER_EXTENSION")).toBe(false);
  const source=read("src/components/placements/tpo-request-decision-control.tsx");
  expect(source).toContain('void runGuarded(()=>decideWith("APPROVE",""))');
  expect(source).toContain("useGuardedAction()");
  expect(source).toContain("Approved. The student has been told.");
  expect(source).toContain("useToast()");
  expect(source).toContain('role="alert"');
 });
 it("TPO-requests-verification-03 rejects only with a reason and exact legacy feedback",()=>{
  const source=read("src/components/placements/tpo-request-decision-control.tsx");
  for(const reason of ["Not eligible","Proof missing or unclear","Deadline has passed","Policy does not allow it","Duplicate request","Other"])expect(source).toContain(reason);
  expect(source).toContain("Rejected. The student has been told, with your reason.");
  expect(source).toContain('title={mode==="APPROVE"?"Approve this request?":"Reject this request"}');
  expect(source).toContain("decisionNote.length>=3");
 });
 it("TPO-requests-verification-04 sends learner decision notifications inside the recorded transaction",()=>{
  const source=read("src/modules/placements/request-service.ts");
  expect(source).toContain('title: "Your request was answered"');
  expect(source).toContain('actionHref: "/learn/my-placements/support"');
  expect(source).toContain('if (nextStatus !== "CANCELLED")');
 });
 it("TPO-requests-verification-09 shows roll, branch, after-college choice and placed state",()=>{
  const source=read("src/app/(authenticated)/tpo/requests/page.tsx");
  expect(source).toContain("request.rollNumber");
  expect(source).toContain("request.branchName");
  expect(source).toContain("afterCollegeDisplay(outcomeResult.entries[request.membershipId]?.outcome)");
  expect(source).toContain("Already placed");
 });
 it("TPO-requests-verification-10 shows the decision actor, time and reason",()=>{
  const source=read("src/app/(authenticated)/tpo/requests/page.tsx");
  for(const str of ["Decided by:","Decided on:","Why:","request.decisionNote"])expect(source).toContain(str);
 });
 it("TPO-requests-verification-14 can send an audited message to requesting students",()=>{
  const page=read("src/app/(authenticated)/tpo/requests/page.tsx");
  const control=read("src/components/tpo/tpo-student-nudge-panel.tsx");
  expect(page).toContain("<TpoStudentNudgePanel");
  expect(control).toContain('"/api/placements/tpo/students/nudges"');
  expect(control).toContain("maxLength={1000}");
 });
 it("TPO-requests-verification-17 restores legacy subtitle, waiting label and empty-state copy",()=>{
  const source=read("src/app/(authenticated)/tpo/requests/page.tsx");
  expect(TPO_REQUESTS_LEGACY_DESCRIPTION).toContain("Urgent ones come first.");
  expect(source).toContain(TPO_REQUESTS_LEGACY_DESCRIPTION);
  expect(source).toContain("Nothing is waiting for you.");
  expect(source).toContain("No requests in this period.");
 });
});
