import { describe, expect, it } from "vitest";
import { playbackGrantRefreshDelay, resumePositionForGrant } from "@/modules/courses/learner-video-grant-model";

describe("learner signed video playback renewal", () => {
  it("resumes saved learner progress on the initial grant", () => {
    expect(resumePositionForGrant(0, 85, 45, false)).toBe(85);
    expect(resumePositionForGrant(0, 0, 12, false)).toBe(12);
    expect(resumePositionForGrant(Number.NaN, -10, -1, false)).toBe(0);
  });
  it("does not jump forward when a learner intentionally rewinds before renewal", () => {
    expect(resumePositionForGrant(24, 85, 45, true)).toBe(24);
    expect(resumePositionForGrant(0, 85, 45, true)).toBe(0);
  });
  it("renews thirty seconds ahead and never schedules a stale grant", () => {
    const now = Date.parse("2026-10-16T10:00:00Z");
    expect(playbackGrantRefreshDelay("2026-10-16T10:10:00Z", now)).toBe(570_000);
    expect(playbackGrantRefreshDelay("2026-10-16T10:00:00Z", now)).toBe(0);
    expect(playbackGrantRefreshDelay("invalid", now)).toBe(0);
    // LEARNER-VIDEO-GRANT-02: a grant inside the renewal safety window
    // must not wait an artificial second and expire before the next request.
    expect(playbackGrantRefreshDelay("2026-10-16T10:00:00.100Z", now)).toBe(0);
    expect(playbackGrantRefreshDelay("2026-10-16T10:00:10Z", now)).toBe(0);
    expect(playbackGrantRefreshDelay("2026-10-16T10:00:29Z", now)).toBe(0);
    expect(playbackGrantRefreshDelay("2026-10-16T10:00:31Z", now)).toBe(1_000);
  });
});
