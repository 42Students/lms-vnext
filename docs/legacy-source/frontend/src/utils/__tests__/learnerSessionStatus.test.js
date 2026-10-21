import dayjs from "dayjs";
import { learnerAttendanceTally, learnerSessionStatus } from "../attendanceConstants";

// LRN-AT-01 / LRN-T-05: a future or never-marked session is never counted or shown as Present.
describe("learnerSessionStatus", () => {
  const now = dayjs("2026-10-06T10:00:00");
  const past = { classScheduleId: 1, startTime: "2026-10-05T09:00:00", attendanceMarked: true };
  const pastUnmarked = { classScheduleId: 2, startTime: "2026-10-05T11:00:00", attendanceMarked: false };
  const future = { classScheduleId: 3, startTime: "2026-10-07T09:00:00", attendanceMarked: false };
  const absent = { classScheduleId: 4, startTime: "2026-10-04T09:00:00", attendanceMarked: true };

  it("names each state", () => {
    expect(learnerSessionStatus(future, [], now).label).toBe("Scheduled");
    expect(learnerSessionStatus(pastUnmarked, [], now).label).toBe("Not marked");
    expect(learnerSessionStatus(absent, [4], now).label).toBe("Absent");
    expect(learnerSessionStatus(past, [], now).label).toBe("Present");
  });

  it("counts only marked sessions", () => {
    expect(learnerAttendanceTally([past, pastUnmarked, future, absent], [4], now)).toEqual({ present: 1, absent: 1, counted: 2 });
  });
});
