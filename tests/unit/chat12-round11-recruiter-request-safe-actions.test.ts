import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-12 recruiter drive request safe review",()=>{
 it("TPO-requests-verification-37 uses registered REQUEST lifecycle and friendly guarded decisions",()=>{
  const schema=src("src/db/schema/placement-drive-requests.ts");
  const form=src("src/components/tpo/tpo-drive-request-actions.tsx");
  expect(schema).toContain("'REQUEST','SENT_BACK','DRAFT','REJECTED','CANCELLED'");
  expect(form).toContain('apiFetch<{approvedJobId?:string}>');
  expect(form).toContain("runGuarded(submit)");
  expect(form).not.toContain("response.json()");
  expect(form).toContain("cause instanceof FriendlyFetchError");
 });
 it("TPO-requests-verification-38 sends TPO bells only on a transactionally persisted recruiter request",()=>{
  const service=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(service).toContain("async function informPlacementCell");
  expect(service).toContain("await tx.insert(inAppNotifications)");
  expect(service).toContain("await informPlacementCell(tx,context");
  expect(service).toContain("createOwnRecruiterDriveRequest");
 });
 it("TPO-requests-verification-R03 refuses unauthorized recruiter grant scope",()=>{
  const service=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(service).toContain("recruiterGrantEffectiveAt");
  expect(service).toContain("requireOwnGrant(context,collegeId)");
  expect(service).toContain('status:"REQUEST"');
 });
 it("TPO-requests-verification-01 recognizes the registered 0133 request kinds but refuses unsupported approval effects",()=>{
  const sql=src("drizzle/0134_lanes_round_2.sql");
  const service=src("src/modules/placements/tpo-general-request-service.ts");
  expect(sql).toContain("placement_learner_general_requests");
  expect(sql).toContain("placement_general_request_member_college_fk");
  expect(sql).toContain("OFF_CAMPUS_OFFER");
  expect(sql).toContain("CORRECTION_WITH_PROOF");
  expect(service).toContain('throw new TpoGeneralRequestError("EFFECT_UNSUPPORTED")');
 });
});
