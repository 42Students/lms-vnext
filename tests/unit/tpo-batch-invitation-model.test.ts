import { describe, expect, it } from "vitest";
import {
  formatTpoBatchInviteSuccess, registrationDeadlineAtEndOfDay, TpoBatchInvitationError,
  tpoBatchInvitationSchema, tpoBatchDeadlineSchema, TPO_INVITATION_COPY,
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
  it("permits clearing a deadline but rejects arbitrary update fields", () => {
    expect(tpoBatchDeadlineSchema.safeParse({ deadline: null, expectedVersion: "none" }).success).toBe(true);
    expect(tpoBatchDeadlineSchema.safeParse({ deadline: "", expectedVersion: "none" }).success).toBe(false);
    expect(tpoBatchDeadlineSchema.safeParse({
      deadline: null, expectedVersion: "none", rulesOverride: {},
    }).success).toBe(false);
  });
  it("uses the exact singular and plural invitation success wording", () => {
    expect(formatTpoBatchInviteSuccess(1, "2026-10-17"))
      .toBe("Invited 1 student to register by 17 Oct");
    expect(formatTpoBatchInviteSuccess(12, "2026-12-01"))
      .toBe("Invited 12 students to register by 1 Dec");
  });
  it("preserves the exact legacy controls", () => {
    expect(TPO_INVITATION_COPY.dateLabel).toBe("Register by");
    expect(TPO_INVITATION_COPY.invitation).toBe("Invite");
    expect(TPO_INVITATION_COPY.pickDate).toBe("Pick the date first");
    expect(TPO_INVITATION_COPY.move).toBe("Move");
    expect(TPO_INVITATION_COPY.reopenAndTell).toBe("Reopen and tell them");
  });
});
