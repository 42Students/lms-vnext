import {describe,expect,it} from "vitest";
import {DEFAULT_LEARNER_APPLICATION_FILTERS} from "@/modules/placements/learner-applications-browse-model";
import {learnerApplicationActiveFilterCount,learnerApplicationMobileSummary}
from "@/modules/placements/learner-applications-mobile-model";
describe("mobile own application filters",()=>{
it("shows no invented selections on first load",()=>{
expect(learnerApplicationMobileSummary(DEFAULT_LEARNER_APPLICATION_FILTERS))
.toBe("Show application filters");
});
it("reports restored search/stage/view controls and does not count defaults",()=>{
const filters={...DEFAULT_LEARNER_APPLICATION_FILTERS,search:"developer",
view:"completed" as const,stage:"SHORTLISTED"};
expect(learnerApplicationActiveFilterCount(filters)).toBe(3);
expect(learnerApplicationMobileSummary(filters)).toContain("3 active");
});
});