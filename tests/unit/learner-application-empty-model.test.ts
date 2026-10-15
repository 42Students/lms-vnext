import {describe,expect,it} from "vitest";
import {learnerApplicationEmptyKind} from "@/modules/placements/learner-application-empty-model";
describe("L14-023 separate learner first-run and filter-empty",()=>{
 it("distinguishes genuine no saved applications from a constrained view",()=>{
  expect(learnerApplicationEmptyKind(0,0)).toBe("NO_APPLICATIONS");
  expect(learnerApplicationEmptyKind(7,0)).toBe("FILTERED_OUT");
  expect(learnerApplicationEmptyKind(7,2)).toBe("HAS_RESULTS");
 });
});
