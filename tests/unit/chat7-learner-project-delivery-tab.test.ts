import {describe,expect,it} from "vitest";
import {LEARNER_PROJECT_DETAIL_TABS,canonicalLearnerProjectTab} from "@/modules/projects/learner-project-tab-alias-model";
describe("L21-010 learner Project final delivery navigation",()=>{
  it("provides a reachable canonical Final Delivery tab",()=>{
    expect(LEARNER_PROJECT_DETAIL_TABS.find(x=>x.key==="delivery")?.label).toBe("Final Delivery");
    expect(canonicalLearnerProjectTab("delivery")).toBe("delivery");
  });
  it("does not expose admin-only Task Allocation",()=>{
    expect(LEARNER_PROJECT_DETAIL_TABS.some(x=>String(x.key)==="allocation")).toBe(false);
  });
});
