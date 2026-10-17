import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL("../../" + path, import.meta.url), "utf8");
}

describe("Learner notification and placement UI source guards", () => {
  it("links pagination from the existing personal/announcement inbox", () => {
    const page = source("src/app/(authenticated)/learn/notifications/page.tsx");
    const inbox = source("src/components/activity/learner-notifications-inbox.tsx");
    const history = source("src/app/(authenticated)/learn/notifications/history/page.tsx");
    expect(page).toContain("LearnerNotificationsInbox");
    expect(inbox).toContain("Browse older personal notifications");
    expect(inbox).toContain("/learn/notifications/history");
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

  it("scopes Learner mark-read through persisted membership even on legacy shared API routes", () => {
    const scoped = source("src/modules/activity/learner-notification-read-service.ts");
    const auth = source("src/modules/activity/learner-notification-membership-service.ts");
    const shared = source("src/app/api/notifications/[notificationId]/read/route.ts");
    const bulk = source("src/app/api/notifications/read-all/route.ts");
    const specific = source("src/app/api/learn/notifications/[notificationId]/read/route.ts");
    const list = source("src/components/activity/notification-list.tsx");
    const history = source("src/modules/activity/learner-notification-history-service.ts");
    expect(auth).toContain('eq(membershipRoles.role, "LEARNER")');
    expect(auth).toContain("requirePermission");
    expect(scoped).toContain("eq(activityEvents.collegeId, membership.collegeId)");
    expect(scoped).toContain("markAllOwnNotificationsRead(context, { collegeId: membership.collegeId })");
    expect(shared).toContain('context.membership?.roles.includes("LEARNER")');
    expect(shared).toContain("markOwnLearnerNotificationRead");
    expect(bulk).toContain("markAllOwnLearnerNotificationsRead");
    expect(specific).toContain("isSameOriginRequest(request)");
    expect(list).toContain('readEndpoint + "/" + id + "/read"');
    expect(list).toContain("item.actionLabel");
    expect(history).toContain("collegeId: membership.collegeId");
  });

  it("continues using the existing same-origin guard on notification writes", () => {
    for (const path of [
      "src/app/api/notifications/[notificationId]/read/route.ts",
      "src/app/api/learn/notifications/[notificationId]/read/route.ts",
      "src/app/api/notifications/read-all/route.ts",
    ]) {
      expect(source(path)).toContain("isSameOriginRequest(request)");
    }
  });
});
