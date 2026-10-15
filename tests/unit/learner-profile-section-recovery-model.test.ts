import {describe,it,expect} from "vitest";
import {learnerProfileSectionRecoveryNotice} from "@/modules/people/learner-profile-section-recovery-model";
describe("learner own Profile section link",()=>{
 it("allows exact saved sections and an absent query",()=>{
  expect(learnerProfileSectionRecoveryNotice("contacts")).toBeNull();
  expect(learnerProfileSectionRecoveryNotice(undefined)).toBeNull();
 });
 it("does not echo forged or duplicated query values",()=>{
  const value="another-user-private-document";
  const note=learnerProfileSectionRecoveryNotice(value);
  expect(note).toContain("not available");
  expect(note).not.toContain(value);
  expect(learnerProfileSectionRecoveryNotice(["contacts","skills"])).toContain("not available");
 });
});
