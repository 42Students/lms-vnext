import { describe, expect, it } from "vitest";
import {
  learnerAssessmentReminderId,
  learnerAssessmentReminderStorageKey,
  parseLearnerAssessmentReminders,
  toggleLearnerAssessmentReminder,
} from "@/modules/placements/learner-assessment-reminders";

describe("Learner-only local assessment reminders", () => {
  it("isolates browser keys by membership without storing official results", () => {
    expect(learnerAssessmentReminderStorageKey("learner-1"))
      .not.toBe(learnerAssessmentReminderStorageKey("learner-2"));
    expect(learnerAssessmentReminderId("application", "round")).toBe("application:round");
  });
  it("adds and removes an optional reminder, without changing the original", () => {
    const first = toggleLearnerAssessmentReminder(
      {}, "application:round", "2026-10-13T10:00:00.000Z",
    );
    expect(first).toEqual({"application:round":"2026-10-13T10:00:00.000Z"});
    expect(toggleLearnerAssessmentReminder(first, "application:round",
      "2026-10-13T11:00:00.000Z")).toEqual({});
    expect(first["application:round"]).toBeDefined();
  });
  it("ignores corrupted and non-map browser storage", () => {
    expect(parseLearnerAssessmentReminders("{broken")).toEqual({});
    expect(parseLearnerAssessmentReminders("[]")).toEqual({});
    expect(parseLearnerAssessmentReminders(null)).toEqual({});
  });
  it("filters malformed IDs and timestamps without executing or leaking values", () => {
    expect(parseLearnerAssessmentReminders(JSON.stringify({
      "application:round":"2026-10-13T10:00:00.000Z",
      "invalid<script>":"2026-10-13T10:00:00.000Z",
      "a:b":"not-a-date",
    }))).toEqual({"application:round":"2026-10-13T10:00:00.000Z"});
  });
  it("rejects malformed membership or assessment IDs", () => {
    expect(() => learnerAssessmentReminderStorageKey("../learner")).toThrow();
    expect(() => learnerAssessmentReminderId("application", "../round")).toThrow();
  });
});
