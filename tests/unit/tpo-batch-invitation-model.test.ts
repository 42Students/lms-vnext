import { describe, expect, it } from "vitest";
import {
  registrationDeadlineAtEndOfDay, TpoBatchInvitationError,
  tpoBatchInvitationSchema, TPO_INVITATION_COPY,
} from "@/modules/placements/tpo-batch-invitation-model";

describe("TPO-batches-18 invitation date and exact legacy copy", () => {
  const now = new Date("2026-10-16T08:30:00.000Z");
  it("uses the last millisecond of the selected IST day", () => {
    expect(registrationDeadlineAtEndOfDay("2026-10-17", now).toISOString())
      .toBe("2026-10-17T18:29:59.999Z");
  });
  it("rejects elapsed dates and invalid calendar days", () => {
    expect(() => registrationDeadlineAtEndOfDay("2026-10-15", now))
      .toThrow(TpoBatchInvitationError);
    expect(() => registrationDeadlineAtEndOfDay("2026-02-30", now))
      .toThrow("DEADLINE_REQUIRED");
  });
  it("rejects malformed client requests", () => {
    expect(tpoBatchInvitationSchema.safeParse({ deadline: "2026-10-17" }).success).toBe(false);
    expect(tpoBatchInvitationSchema.safeParse({
      deadline: "2026-10-17", expectedVersion: "none", other: true,
    }).success).toBe(false);
  });
  it("preserves the exact legacy controls", () => {
    expect(TPO_INVITATION_COPY.dateLabel).toBe("Register by");
    expect(TPO_INVITATION_COPY.invitation).toBe("Invite");
    expect(TPO_INVITATION_COPY.pickDate).toBe("Pick the date first");
  });
});
