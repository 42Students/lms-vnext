import {describe,it,expect} from "vitest";
import {learnerJobDeadlineLabel} from "@/modules/placements/learner-job-deadline-label-model";
describe("published drive deadline display",()=>{
 it("never throws on corrupted deadline values",()=>{
  expect(learnerJobDeadlineLabel(null)).toBe("Not specified");
  expect(learnerJobDeadlineLabel("bad-date")).toBe("Not available");
  expect(learnerJobDeadlineLabel("")).toBe("Not specified");
 });
 it("renders saved UTC instants in India local time",()=>{
  expect(learnerJobDeadlineLabel("2026-10-15T13:00:00.000Z")).toContain("2026");
 });
});