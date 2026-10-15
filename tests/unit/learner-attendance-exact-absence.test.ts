import { describe, expect, it } from "vitest";
import { learnerAttendanceExactAbsences } from "@/modules/attendance/learner-attendance-exact-absence-model";
describe("learner exact absence KPI",()=>{
  it("excludes marked exceptions and pending sessions",()=>{
    expect(learnerAttendanceExactAbsences([{status:"ABSENT"},{status:"PRESENT"},{status:"LATE"},{status:"MEDICAL"},{status:"EXCUSED"},{status:"NOT_MARKED"},{status:"SCHEDULED"}])).toBe(1);
  });
  it("does not invent absences in empty months",()=>expect(learnerAttendanceExactAbsences([])).toBe(0));
});
