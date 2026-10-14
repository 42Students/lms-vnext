import {describe,expect,it} from "vitest";
import {hrResultDeadlineUrgency,HR_DEADLINE_URGENCY_LABELS} from "@/modules/placements/hr-result-deadline-urgency-model";
describe("HR Today deadline urgency",()=>{
 it("separates passed, next-day and future timestamps",()=>{
  const now=new Date("2026-10-15T10:00:00Z");
  expect(hrResultDeadlineUrgency(new Date("2026-10-15T09:59:59Z"),now)).toBe("PASSED");
  expect(hrResultDeadlineUrgency(new Date("2026-10-16T10:00:00Z"),now)).toBe("WITHIN_24H");
  expect(hrResultDeadlineUrgency(new Date("2026-10-16T10:00:01Z"),now)).toBe("UPCOMING");
  expect(HR_DEADLINE_URGENCY_LABELS.PASSED).toBe("Result deadline passed");
 });
});
