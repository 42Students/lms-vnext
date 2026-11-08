import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { learnerNoticeUnreadCount } from "@/modules/placements/learner-placement-notice-view-model";

const ready = { noticesAvailable: true, receiptsAvailable: true };
const notice = (unread: boolean | null) => ({ unread });

describe("learner placement notice unread summary", () => {
  it("distinguishes empty feed from unavailable feed", () => {
    expect(learnerNoticeUnreadCount([], ready)).toBe(0);
    expect(learnerNoticeUnreadCount([], {
      noticesAvailable: false, receiptsAvailable: false,
    })).toBeNull();
  });

  it("does not report zero when receipts are missing or partially unknown", () => {
    expect(learnerNoticeUnreadCount([notice(false)], {
      noticesAvailable: true, receiptsAvailable: false,
    })).toBeNull();
    expect(learnerNoticeUnreadCount([notice(false), notice(null)], ready)).toBeNull();
  });

  it("announces receipt and unread-count source failures in the learner UI", () => {
    const source = readFileSync(
      "src/app/(authenticated)/learn/my-placements/announcements/page.tsx", "utf8",
    );
    expect(source).toContain("!collegeNoticesRead.available || !receiptsRead.available");
    expect(source).toContain("!personalAlerts.available || !unreadCount.available");
    expect(source).toContain("learnerNoticeUnreadCount(allNotices");
    expect(source).toContain("<TextLink href={tabHref(activeView)}");
  });

  it("counts only explicitly unread receipts when both reads succeeded", () => {
    expect(learnerNoticeUnreadCount(
      [notice(true), notice(false), notice(true)], ready,
    )).toBe(2);
    expect(learnerNoticeUnreadCount([notice(false)], ready)).toBe(0);
  });
});
