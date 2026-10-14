import {describe,expect,it} from "vitest";
import {learnerRoundTimeSignal,learnerRoundTimeLabel} from "@/modules/placements/learner-round-time-signal";
describe("learner scheduled round signal without fabricated outcome",()=>{
  const start="2026-10-14T08:00:00Z";
  it("uses persisted time and duration; does not infer completion",()=>{
    expect(learnerRoundTimeSignal({scheduledAt:start,durationMinutes:45},Date.parse("2026-10-14T07:59:59Z")))
      .toBe("UPCOMING");
    expect(learnerRoundTimeSignal({scheduledAt:start,durationMinutes:45},Date.parse("2026-10-14T08:20:00Z")))
      .toBe("IN_SCHEDULED_WINDOW");
    expect(learnerRoundTimeSignal({scheduledAt:start,durationMinutes:45},Date.parse("2026-10-14T08:45:00Z")))
      .toBe("SCHEDULED_TIME_PASSED");
    expect(learnerRoundTimeLabel("SCHEDULED_TIME_PASSED")).toBe("Scheduled time passed");
  });
  it("never invents a window when no duration or time is recorded",()=>{
    expect(learnerRoundTimeSignal({scheduledAt:null,durationMinutes:null},0))
      .toBe("AWAITING_SCHEDULE");
    expect(learnerRoundTimeSignal({scheduledAt:start,durationMinutes:null},Date.parse("2026-10-14T08:20:00Z")))
      .toBe("SCHEDULED_TIME_PASSED");
  });
});
