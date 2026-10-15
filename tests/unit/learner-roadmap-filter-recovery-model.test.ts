import {describe,it,expect} from "vitest";
import {learnerRoadmapFilterRecoveryNotice} from "@/modules/courses/learner-roadmap-filter-recovery-model";
describe("learner Learning Path invalid filters",()=>{
 it("keeps every supported content category",()=>{
  for(const filter of ["all","lectures","resources","assessments","live-sessions"])
   expect(learnerRoadmapFilterRecoveryNotice(filter)).toBeNull();
 });
 it("does not echo unknown filter content",()=>{
  const bad="invalid/foreign";
  const note=learnerRoadmapFilterRecoveryNotice(bad);
  expect(note).toContain("not available");
  expect(note).not.toContain(bad);
 });
});
