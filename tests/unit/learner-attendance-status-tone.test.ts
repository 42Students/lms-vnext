import { describe, it, expect } from "vitest";
import { learnerAttendanceStatusTone } from "@/modules/attendance/learner-attendance-status-tone-model";
describe("learner Attendance exception presentation", () => {
  it("does not imply an excused or medical session is a disciplinary absence", () => {
    expect(learnerAttendanceStatusTone("EXCUSED")).toBe("neutral");
    expect(learnerAttendanceStatusTone("MEDICAL")).toBe("neutral");
    expect(learnerAttendanceStatusTone("ABSENT")).toBe("error");
  });
  it("distinguishes late, pending, scheduled and present", () => {
    expect(learnerAttendanceStatusTone("LATE")).toBe("warning");
    expect(learnerAttendanceStatusTone("NOT_MARKED")).toBe("warning");
    expect(learnerAttendanceStatusTone("SCHEDULED")).toBe("neutral");
    expect(learnerAttendanceStatusTone("PRESENT")).toBe("success");
  });
});
