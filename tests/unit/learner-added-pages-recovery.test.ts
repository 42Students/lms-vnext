import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const base = "src/app/(authenticated)";
function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), base, relative), "utf8");
}

/**
 * Pages introduced in Learner parity batches must keep an explicit boundary
 * and a responsive page plus a truthful no-record/filtered-empty state.
 * Inherited layouts are not substitutes for a page-specific retry label.
 */
const detailPages = [
  ["learn/my-placements/applications/[applicationId]/history",
    "No application-status history records", "sm:"],
  ["learn/my-placements/applications/[applicationId]/company",
    "No extended company biography", "sm:"],
  ["learn/my-placements/offers", "learnerOffersEmptyState", "sm:"],
  ["learn/my-placements/assessments/results", "No official assessment results yet", "sm:"],
  ["learn/notifications/history", "emptyMessage", "NotificationList"],
  ["learn/courses/[deliveryId]/progress", "No published lessons", "sm:"],
  ["learn/courses/[deliveryId]/attendance-summary", "No attendance sessions for this selection", "sm:"],
] as const;

describe("Learner added page mobile/recovery/empty audit", () => {
  it.each(detailPages)(
    "%s has a real mobile layout and an honest empty state",
    (directory, emptyMarker, responsiveMarker) => {
      const page = read(directory + "/page.tsx");
      expect(page).toContain(responsiveMarker);
      expect(page).toContain(emptyMarker);
      const loading = read(directory + "/loading.tsx");
      const error = read(directory + "/error.tsx");
      expect(loading).toContain("Loading");
      expect(error).toContain("Retry");
      expect(error).toContain('"use client"');
    },
  );

  it("retains resilient Profile and Placement Cell boundaries", () => {
    for (const route of ["learn/profile", "learn/my-placements/placement"]) {
      expect(read(route + "/loading.tsx")).toContain("Loading");
      expect(read(route + "/error.tsx")).toContain("Retry");
    }
    const notificationList = fs.readFileSync(path.join(
      process.cwd(), "src/components/activity/notification-list.tsx",
    ), "utf8");
    expect(notificationList).toContain("sm:");
    const placementPage = read("learn/my-placements/placement/page.tsx");
    expect(placementPage).toContain("LearnerPlacementAlerts");
    const personalAlerts = fs.readFileSync(path.join(
      process.cwd(), "src/components/placements/learner-placement-alerts.tsx",
    ), "utf8");
    expect(personalAlerts).toContain("No personal placement alerts");
    expect(personalAlerts).toContain("sm:");
  });
});
