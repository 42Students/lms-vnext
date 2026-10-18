import { describe, expect, it } from "vitest";
import { summarizeRecruiterUnread } from "@/modules/placements/hr-conversation-unread-model";
import { hrNotificationReadError } from "@/modules/placements/hr-notification-read-feedback-model";
import { groupHrNotificationPage } from "@/modules/placements/hr-notification-groups-model";
import { hrTeamRosterMessage } from "@/modules/placements/hr-team-roster-message-model";
import {
  recruiterMessageTpoHref,
  recruiterMessageTpoPreview,
  recruiterMessageTpoRecipients,
  RECRUITER_MESSAGE_TPO_TITLE,
} from "@/modules/placements/recruiter-message-tpo-notification-model";

describe("chat-16 recruiter notification presentation behaviour", () => {
  it("HR-NOTICE-UNREAD-16 sums unread per thread without allowing negative counts to subtract", () => {
    expect(summarizeRecruiterUnread([{ unread: 2 }, { unread: -4 }, { unread: 3 }])).toBe(5);
    expect(summarizeRecruiterUnread([])).toBe(0);
  });

  it("HR-NOTICE-GROUP-16 groups repeated job IDs and counts only unread records", () => {
    const rows = [
      { id: "n1", jobId: "j1", title: "Role A", unread: true },
      { id: "n2", jobId: "j2", title: "Role B", unread: false },
      { id: "n3", jobId: "j1", title: "Role A", unread: false },
    ];
    expect(groupHrNotificationPage(rows)).toEqual([
      { jobId: "j1", title: "Role A", unread: 1, items: [rows[0], rows[2]] },
      { jobId: "j2", title: "Role B", unread: 0, items: [rows[1]] },
    ]);
  });

  it("HR-NOTICE-READ-FEEDBACK-16 distinguishes session, permission, missing and conflict without raw codes", () => {
    expect(hrNotificationReadError(401)).toMatch(/Sign in again/);
    expect(hrNotificationReadError(403)).toMatch(/no longer have access/);
    expect(hrNotificationReadError(404)).toMatch(/no longer available/);
    expect(hrNotificationReadError(409)).toMatch(/changed/);
    expect(hrNotificationReadError(429)).toMatch(/Too many requests/);
    expect(hrNotificationReadError(503)).toBe("Unable to mark as read. Check your connection and try again.");
  });

  it("HR-TEAM-ROSTER-16 distinguishes no access, no search results, empty page and sole owner", () => {
    expect(hrTeamRosterMessage([], 0, "", 0)).toMatch(/No active teammates/);
    expect(hrTeamRosterMessage([{ isYou: true }], 0, "someone", 0)).toMatch(/No authorized teammates/);
    expect(hrTeamRosterMessage([{ isYou: true }], 1, "", 0)).toMatch(/earlier page/);
    expect(hrTeamRosterMessage([{ isYou: true }], 1, "", 1)).toMatch(/Only you so far/);
    expect(hrTeamRosterMessage([{ isYou: true }, { isYou: false }], 2, "", 2)).toBeNull();
  });

  it("REC-calendar-messages-profile-17 excludes the sender and duplicate active TPO recipients", () => {
    expect(recruiterMessageTpoRecipients([
      { userId: "recipient-a" }, { userId: "recipient-a" },
      { userId: "sender" }, { userId: "recipient-b" },
    ], "sender")).toEqual(["recipient-a", "recipient-b"]);
    expect(recruiterMessageTpoRecipients([], "sender")).toEqual([]);
  });

  it("HR-NOTICE-TPO-LINK-16 rejects malformed thread links and bounds message preview by codepoints", () => {
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    expect(recruiterMessageTpoHref(id)).toBe("/tpo/messages/" + id);
    expect(recruiterMessageTpoHref("../admin?impersonate=true")).toBe("/tpo/messages");
    expect(RECRUITER_MESSAGE_TPO_TITLE).toBe("New message from a recruiter");
    expect(recruiterMessageTpoPreview(" 🌐".repeat(121)).endsWith("…")).toBe(true);
    expect(Array.from(recruiterMessageTpoPreview("🌐".repeat(121))).toHaveLength(121);
  });
});
