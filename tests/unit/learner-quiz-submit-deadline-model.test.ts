import {describe,expect,it} from "vitest";
import {learnerQuizSubmitDeadlineOpen} from "@/modules/courses/learner-quiz-submit-deadline-model";
describe("learner quiz submit deadline",()=>{
 const now=Date.parse("2026-10-15T10:00:00Z");
 it("allows no deadline and the exact recorded expiry instant",()=>{
   expect(learnerQuizSubmitDeadlineOpen(null,now)).toBe(true);
   expect(learnerQuizSubmitDeadlineOpen("2026-10-15T10:00:00Z",now)).toBe(true);
 });
 it("fails closed for invalid and past deadlines",()=>{
   expect(learnerQuizSubmitDeadlineOpen("invalid",now)).toBe(false);
   expect(learnerQuizSubmitDeadlineOpen("2026-10-15T09:59:59Z",now)).toBe(false);
   expect(learnerQuizSubmitDeadlineOpen("2026-10-15T10:00:00Z",NaN)).toBe(false);
 });
});
