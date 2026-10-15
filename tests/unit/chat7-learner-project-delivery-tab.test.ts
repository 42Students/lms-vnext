import {describe,expect,it} from "vitest";
import {LEARNER_PROJECT_DETAIL_TABS,canonicalLearnerProjectTab} from "@/modules/projects/learner-project-tab-alias-model";
describe("L21-010 learner Project final delivery navigation",()=>{
  it("keeps Final Delivery reachable via canonical ?tab=delivery without a tab-strip entry",()=>{
    expect(LEARNER_PROJECT_DETAIL_TABS.some(x=>String(x.key)==="delivery")).toBe(false);
    expect(canonicalLearnerProjectTab("delivery")).toBe("delivery");
  });
  it("does not expose admin-only Task Allocation",()=>{
    expect(LEARNER_PROJECT_DETAIL_TABS.some(x=>String(x.key)==="allocation")).toBe(false);
  });
});
