import {describe,expect,it} from "vitest";
import {learnerQuizClockInterval} from "@/modules/courses/learner-quiz-clock-interval-model";
const now=Date.parse("2026-10-15T12:00:00Z");
describe("quiz deadline clock cadence",()=>{
 it("updates every second during the final minute and after expiry",()=>{
   expect(learnerQuizClockInterval("2026-10-15T12:00:59Z",now)).toBe(1000);
   expect(learnerQuizClockInterval("2026-10-15T11:59:59Z",now)).toBe(1000);
 });
 it("uses a modest clock cadence for distant and deadline-free quizzes",()=>{
   expect(learnerQuizClockInterval(null,now)).toBe(30000);
   expect(learnerQuizClockInterval("2026-10-15T12:05:00Z",now)).toBe(5000);
   expect(learnerQuizClockInterval("2026-10-15T13:00:00Z",now)).toBe(30000);
 });
});
