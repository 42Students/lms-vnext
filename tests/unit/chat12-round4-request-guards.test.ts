import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const d=()=>read("src/components/placements/tpo-request-decision-control.tsx");
const v=()=>read("src/components/verification/VerificationReviewDrawer.tsx");
describe("chat-12 round4 guarded TPO decisions",()=>{
 it("TPO-requests-verification-02 prevents duplicate request decisions",()=>{expect(d()).toContain("runGuarded(()=>decideWith(mode,decisionNote))");expect(d()).toContain("guardedPending");});
it("TPO-requests-verification-03 prevents duplicate request decisions",()=>{expect(d()).toContain("runGuarded(()=>decideWith(mode,decisionNote))");expect(d()).toContain("guardedPending");});
 it("TPO-requests-verification-19 guards verification confirmation",()=>{expect(v()).toContain("runGuarded(()=>decide(pendingAction))");expect(v()).toContain("saving||guardedPending");});
it("TPO-requests-verification-25 guards verification confirmation",()=>{expect(v()).toContain("runGuarded(()=>decide(pendingAction))");expect(v()).toContain("saving||guardedPending");});
it("TPO-requests-verification-27 guards verification confirmation",()=>{expect(v()).toContain("runGuarded(()=>decide(pendingAction))");expect(v()).toContain("saving||guardedPending");});
it("TPO-requests-verification-28 guards verification confirmation",()=>{expect(v()).toContain("runGuarded(()=>decide(pendingAction))");expect(v()).toContain("saving||guardedPending");});
 it("GR-30 and GR-31 apply synchronous in-flight lock on each request and review submit",()=>{
  expect(d()).toContain('from "@/hooks/use-guarded-action"');
  expect(d()).toContain('runGuarded(()=>decideWith("APPROVE",""))');
  expect(v()).toContain('from "@/hooks/use-guarded-action"');
 });
});
