import { describe, expect, it } from "vitest";
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

  it("counts only explicitly unread receipts when both reads succeeded", () => {
    expect(learnerNoticeUnreadCount(
      [notice(true), notice(false), notice(true)], ready,
    )).toBe(2);
    expect(learnerNoticeUnreadCount([notice(false)], ready)).toBe(0);
  });
});
