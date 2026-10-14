import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL("../../" + path, import.meta.url), "utf8");
}

describe("Learner notification and placement UI source guards", () => {
  it("links pagination from the existing personal/announcement inbox", () => {
    const page = source("src/app/(authenticated)/learn/notifications/page.tsx");
    const history = source("src/app/(authenticated)/learn/notifications/history/page.tsx");
    expect(page).toContain("Browse older personal notifications");
    expect(page).toContain("/learn/notifications/history");
    expect(history).toContain("getOwnLearnerNotificationHistory");
    expect(history).toContain("learnerNotificationHistoryQuerySchema");
    expect(history).toContain("NotificationList");
  });

  it("shows personal placement alerts without claiming official bulletin parity", () => {
    const page = source("src/app/(authenticated)/learn/my-placements/placement/page.tsx");
    const component = source("src/components/placements/learner-placement-alerts.tsx");
    const service = source("src/modules/placements/learner-placement-alerts-service.ts");
    expect(page).toContain("LearnerPlacementAlerts");
    expect(component).toContain("not a substitute for official college-wide placement notices");
    expect(service).toContain('eq(activityEvents.module, "PLACEMENTS")');
    expect(service).toContain("requireLearnerPlacementAccess");
  });

  it("continues using the existing same-origin guard on notification writes", () => {
    for (const path of [
      "src/app/api/notifications/[notificationId]/read/route.ts",
      "src/app/api/notifications/read-all/route.ts",
    ]) {
      expect(source(path)).toContain("isSameOriginRequest(request)");
    }
  });
});
