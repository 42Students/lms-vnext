import {describe,it,expect} from "vitest";
import {canNavigateCollegeVerificationQueue} from "@/modules/verification/bulk-action-guard";
import {readFileSync} from "node:fs";
describe("Verification queue pending-review navigation safety",()=>{
 it("keeps an in-flight decision on its original row until a receipt returns",()=>{
  expect(canNavigateCollegeVerificationQueue(true)).toBe(false);
  expect(canNavigateCollegeVerificationQueue(false)).toBe(true);
 });
 it("does not discard the private drawer before enforcing the busy guard",()=>{
  const code=readFileSync("src/components/verification/CollegeVerificationPanel.tsx","utf8");
  const guard=code.indexOf("if(!canNavigateCollegeVerificationQueue(bulkBusy))return;");
  const dismiss=code.indexOf("setSelected(null);",guard);
  expect(guard).toBeGreaterThan(-1);
  expect(dismiss).toBeGreaterThan(guard);
 });
});
