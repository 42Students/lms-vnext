import { agoText, recruiterActivity } from "../ui/recruiterActivity";

const now = new Date("2026-10-03T12:00:00Z");
describe("recruiterActivity", () => {
  it("says where an invite stands before the recruiter joins", () => {
    expect(recruiterActivity({ inviteStatus: "SENT" }, now).text).toBe("Invite sent, not opened");
    expect(recruiterActivity({ inviteStatus: "CLICKED" }, now).text).toBe("Opened the invite, not joined yet");
    expect(recruiterActivity({ inviteStatus: "BOUNCED" }, now).tone).toBe("bad");
    expect(recruiterActivity({ inviteStatus: "NOT_SENT" }, now).text).toBe("No invite sent");
  });
  it("after joining, says when they last signed in, or that they never have", () => {
    expect(recruiterActivity({ inviteStatus: "JOINED", recruiterLastLoginAt: "2026-10-01T12:00:00Z" }, now)).toEqual({ text: "Joined · signed in 2 days ago", tone: "good" });
    expect(recruiterActivity({ inviteStatus: "JOINED", recruiterLastLoginAt: null }, now)).toEqual({ text: "Joined · has not signed in yet", tone: "warn" });
  });
  it("reads the array form the backend sends", () => {
    expect(agoText([2026, 10, 3, 11, 0, 0], now)).toBe("1 hour ago");
  });
  it("ignores junk", () => {
    expect(agoText("not a date", now)).toBeNull();
    expect(agoText(null, now)).toBeNull();
  });
});
