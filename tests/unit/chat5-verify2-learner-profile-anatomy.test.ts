import {describe,expect,it} from "vitest";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {LEARNER_LEGACY_PROFILE_ANATOMY} from "@/modules/people/learner-profile-checklist";
import {projectLearnerAdminProfileSections} from "@/modules/people/learner-admin-profile-sections";

describe("G2-19-001-045 legacy 20-section learner profile",()=>{
 it("projects all legacy section labels in the same order",()=>{
  const doc=learnerProfileDocumentSchema.parse({});
  const sections=projectLearnerAdminProfileSections(doc);
  expect(sections).toHaveLength(20);
  expect(sections.map(section=>section.label))
   .toEqual(LEARNER_LEGACY_PROFILE_ANATOMY.map(section=>section.label));
 });
 it("shows safe profile entries but never exposes identity numbers or upload receipts",()=>{
  const doc=learnerProfileDocumentSchema.parse({
   headline:"Engineering learner",
   identity:{aadhaarNumber:"123412341234",panNumber:"ABCDE1234F"},
   jobPreferences:{rolePreferences:["Software Engineer"]},
  });
  const sections=projectLearnerAdminProfileSections(doc);
  expect(sections.find(section=>section.key==="header")?.items)
   .toContain("Engineering learner");
  expect(sections.find(section=>section.key==="jobPreferences")?.items.join(" "))
   .toContain("Software Engineer");
  expect(JSON.stringify(sections)).not.toContain("123412341234");
  expect(JSON.stringify(sections)).not.toContain("ABCDE1234F");
  expect(sections.find(section=>section.key==="resume")?.notice).toContain("Private");
 });
});

