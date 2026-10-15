import {describe,it,expect} from "vitest";
import { resolveLearnerCoursePeriod } from "@/modules/courses/learner-course-current-period-model";
describe("learner Course semester refresh",()=>{
  const scoped=[{id:"term-a"},{id:"term-b"}];
  it("keeps a selected authorized historical semester",()=>expect(resolveLearnerCoursePeriod("term-b",scoped)).toBe("term-b"));
  it("falls back to the first returned semester when assignments change",()=>expect(resolveLearnerCoursePeriod("deleted-semester",scoped)).toBe("term-a"));
  it("does not synthesize any term outside enrolled semesters",()=>expect(resolveLearnerCoursePeriod("outside",[])).toBe(""));
});
