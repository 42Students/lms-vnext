import { describe, expect, it } from "vitest";
import {
  generateDeadlineTodayReminderCandidates,
  generateShortlistDueTomorrowCandidates,
} from "@/modules/placements/tpo-announcement-reminder-source-model";

const now = new Date("2026-10-22T02:30:00.000Z"); // 08:00 IST

describe("legacy TPO scheduled reminder source parity", () => {
  it("selects published same-IST-day deadlines, excluding applied learners", () => {
    const base = {
      collegeId: "college-1", jobId: "job-1",
      status: "PUBLISHED" as const, deletedAt: null,
      applicationDeadline: new Date("2026-10-22T18:00:00.000Z"),
      eligibleMembershipIds: ["one", "two", "one"],
      appliedMembershipIds: ["two"],
    };
    expect(generateDeadlineTodayReminderCandidates([base], now)).toMatchObject([
      { collegeId: "college-1", jobId: "job-1", membershipId: "one" },
    ]);
    expect(generateDeadlineTodayReminderCandidates([
      { ...base, status: "DRAFT" },
      { ...base, deletedAt: new Date("2026-10-20T00:00:00Z") },
    ], now)).toEqual([]);
  });

  it("selects the next IST day exactly once per share; excludes revoked shares", () => {
    const source = {
      shareId: "share-1", collegeId: "college-1",
      recipientEmail: " recruiter@example.com ",
      shortlistBy: new Date("2026-10-23T17:00:00.000Z"), revokedAt: null,
      reminderSentOnIstDays: [],
    };
    expect(generateShortlistDueTomorrowCandidates([source], now)).toMatchObject([
      { shareId: "share-1", recipientEmail: "recruiter@example.com" },
    ]);
    expect(generateShortlistDueTomorrowCandidates([
      { ...source, reminderSentOnIstDays: ["2026-10-22"] },
      { ...source, revokedAt: new Date("2026-10-21T00:00:00Z") },
    ], now)).toEqual([]);
  });
});
