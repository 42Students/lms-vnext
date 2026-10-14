import { describe, expect, it } from "vitest";
import {
  collegePeriodLifecycleSchema, periodLifecycleBlocker,
} from "@/modules/academics/college-period-lifecycle-model";

describe("College Academic Period close/reopen", () => {
  it("requires confirmation and allows only the two authorized lifecycle actions", () => {
    expect(collegePeriodLifecycleSchema.parse({action: "CLOSE", confirm: true}))
      .toEqual({action: "CLOSE", confirm: true});
    expect(collegePeriodLifecycleSchema.safeParse({action: "REOPEN"}).success).toBe(false);
    expect(collegePeriodLifecycleSchema.safeParse({action: "CLOSE", confirm: false}).success).toBe(false);
    expect(collegePeriodLifecycleSchema.safeParse({
      action: "CLOSE", confirm: true, collegeId: "foreign",
    }).success).toBe(false);
  });
  it("blocks live sections first, then scheduled sessions, but not confirmed reopen", () => {
    expect(periodLifecycleBlocker("CLOSE", {openSections: 1, scheduledSessions: 1}))
      .toBe("PERIOD_HAS_OPEN_SECTIONS");
    expect(periodLifecycleBlocker("CLOSE", {openSections: 0, scheduledSessions: 1}))
      .toBe("PERIOD_HAS_SCHEDULED_SESSIONS");
    expect(periodLifecycleBlocker("CLOSE", {openSections: 0, scheduledSessions: 0})).toBeNull();
    expect(periodLifecycleBlocker("REOPEN", {openSections: 1, scheduledSessions: 1})).toBeNull();
  });
});
