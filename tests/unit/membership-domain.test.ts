import { describe, expect, it } from "vitest";
import {
  getMembershipLifecyclePatch,
  removeMembershipRoleFromSet,
} from "@/modules/people/membership-domain";
import { PeopleServiceError } from "@/modules/people/errors";

describe("membership domain rules", () => {
  it("removes roles idempotently but never removes the last role", () => {
    expect(
      removeMembershipRoleFromSet(["FACULTY", "MENTOR"], "MENTOR"),
    ).toEqual(["FACULTY"]);

    expect(
      removeMembershipRoleFromSet(["FACULTY"], "MENTOR"),
    ).toEqual(["FACULTY"]);

    expect(() =>
      removeMembershipRoleFromSet(["FACULTY"], "FACULTY"),
    ).toThrowError("LAST_MEMBERSHIP_ROLE");
  });

  it("suspends with an auditable reason and timestamp", () => {
    const now = new Date("2026-10-02T12:00:00Z");
    expect(
      getMembershipLifecyclePatch(
        {
          status: "ACTIVE",
          suspendedAt: null,
          suspensionReason: null,
        },
        {
          action: "SUSPEND",
          reason: "Policy review",
        },
        now,
      ),
    ).toEqual({
      status: "SUSPENDED",
      suspendedAt: now,
      suspensionReason: "Policy review",
    });
  });

  it("keeps repeated lifecycle operations idempotent", () => {
    const suspendedAt = new Date("2026-10-02T12:00:00Z");
    expect(
      getMembershipLifecyclePatch(
        {
          status: "SUSPENDED",
          suspendedAt,
          suspensionReason: "Policy review",
        },
        {
          action: "SUSPEND",
          reason: "Policy review",
        },
        new Date("2026-10-02T13:00:00Z"),
      ),
    ).toBeNull();

    expect(
      getMembershipLifecyclePatch(
        {
          status: "ENDED",
          suspendedAt: null,
          suspensionReason: null,
        },
        { action: "END" },
        new Date("2026-10-02T13:00:00Z"),
      ),
    ).toBeNull();
  });

  it("reactivates suspended membership but never revives an ended one", () => {
    expect(
      getMembershipLifecyclePatch(
        {
          status: "SUSPENDED",
          suspendedAt: new Date("2026-10-02T12:00:00Z"),
          suspensionReason: "Policy review",
        },
        { action: "REACTIVATE" },
        new Date("2026-10-02T13:00:00Z"),
      ),
    ).toEqual({
      status: "ACTIVE",
      suspendedAt: null,
      suspensionReason: null,
    });

    expect(() =>
      getMembershipLifecyclePatch(
        {
          status: "ENDED",
          suspendedAt: null,
          suspensionReason: null,
        },
        { action: "REACTIVATE" },
        new Date("2026-10-02T13:00:00Z"),
      ),
    ).toThrow(PeopleServiceError);
  });

  it("ends active or suspended memberships and clears suspension metadata", () => {
    expect(
      getMembershipLifecyclePatch(
        {
          status: "SUSPENDED",
          suspendedAt: new Date("2026-10-02T12:00:00Z"),
          suspensionReason: "Policy review",
        },
        { action: "END" },
        new Date("2026-10-02T13:00:00Z"),
      ),
    ).toEqual({
      status: "ENDED",
      suspendedAt: null,
      suspensionReason: null,
    });
  });
});
