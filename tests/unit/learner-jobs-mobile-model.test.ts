import {describe,expect,it} from "vitest";
import {learnerJobsActiveFilterCount,learnerJobsMobileFilterLabel} from "@/modules/placements/learner-jobs-mobile-model";
import {DEFAULT_LEARNER_JOB_FILTERS} from "@/modules/placements/learner-jobs-browse-model";
describe("learner drives mobile filter disclosure",()=>{
it("starts accessible and free of invented applied filters",()=>{
expect(learnerJobsActiveFilterCount(DEFAULT_LEARNER_JOB_FILTERS)).toBe(0);
expect(learnerJobsMobileFilterLabel(DEFAULT_LEARNER_JOB_FILTERS)).toBe("Show drive filters");
});
it("surfaces filters already restored from a mobile bookmark",()=>{
const own={...DEFAULT_LEARNER_JOB_FILTERS,search:"engineer",eligibleOnly:true,sort:"newest" as const};
expect(learnerJobsActiveFilterCount(own)).toBe(3);
expect(learnerJobsMobileFilterLabel(own)).toContain("3 active");
});
});