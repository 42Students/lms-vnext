import { describe, expect, it } from "vitest";
import { isRecruiterInviteFirstOpen } from "@/modules/placements/tpo-recruiter-invite-policy";

describe("T-S2-03 recruiter invite first-open idempotency", () => {
  it("records the first open only", () => {
    expect(isRecruiterInviteFirstOpen(null)).toBe(true);
    expect(isRecruiterInviteFirstOpen(new Date("2026-10-16T00:00:00Z"))).toBe(false);
  });
});
