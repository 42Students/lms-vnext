import { describe, expect, it } from "vitest";
import {
  coordinatorGrantCounts,
  coordinatorMayChange,
  isEligibleNominee,
  type CoordinatorFacts,
} from "@/modules/courses/coordinator-policy";

const live: CoordinatorFacts = {
  grantActive: true,
  sameCollege: true,
  userActive: true,
  membershipActive: true,
  hasFacultyRole: true,
  teachesOffering: true,
};

describe("course coordinator policy", () => {
  it("counts only while every live fact holds", () => {
    expect(coordinatorGrantCounts(live)).toBe(true);
    for (const key of Object.keys(live) as (keyof CoordinatorFacts)[]) {
      expect(coordinatorGrantCounts({ ...live, [key]: false })).toBe(false);
    }
  });

  it("lapses when the teacher stops teaching the offering, and works again when they return", () => {
    expect(coordinatorGrantCounts({ ...live, teachesOffering: false })).toBe(false);
    expect(coordinatorGrantCounts({ ...live, teachesOffering: true })).toBe(true);
  });

  it("lets the coordinator change shared content only while the grant counts", () => {
    const shared = { deliveryId: null, teachesTargetDelivery: false };
    expect(coordinatorMayChange(live, shared)).toBe(true);
    expect(coordinatorMayChange({ ...live, grantActive: false }, shared)).toBe(false);
    expect(coordinatorMayChange({ ...live, teachesOffering: false }, shared)).toBe(false);
  });

  it("keeps another teacher's section-only content out of reach", () => {
    expect(coordinatorMayChange(live, { deliveryId: "d-other", teachesTargetDelivery: false })).toBe(false);
    expect(coordinatorMayChange(live, { deliveryId: "d-mine", teachesTargetDelivery: true })).toBe(true);
  });

  it("does not let a revoked grant widen anything, and does not need a grant for own sections", () => {
    const revoked = { ...live, grantActive: false };
    expect(coordinatorMayChange(revoked, { deliveryId: "d-other", teachesTargetDelivery: false })).toBe(false);
    expect(coordinatorMayChange(revoked, { deliveryId: "d-mine", teachesTargetDelivery: true })).toBe(true);
  });

  it("denies a suspended, disabled or role-less person even for their own sections", () => {
    const own = { deliveryId: "d-mine", teachesTargetDelivery: true };
    expect(coordinatorMayChange({ ...live, membershipActive: false }, own)).toBe(false);
    expect(coordinatorMayChange({ ...live, userActive: false }, own)).toBe(false);
    expect(coordinatorMayChange({ ...live, hasFacultyRole: false }, own)).toBe(false);
    expect(coordinatorMayChange({ ...live, sameCollege: false }, own)).toBe(false);
  });

  it("only nominates active faculty of the college who teach the offering", () => {
    const { grantActive: _grantActive, ...nominee } = live;
    expect(isEligibleNominee(nominee)).toBe(true);
    expect(isEligibleNominee({ ...nominee, teachesOffering: false })).toBe(false);
    expect(isEligibleNominee({ ...nominee, hasFacultyRole: false })).toBe(false);
    expect(isEligibleNominee({ ...nominee, sameCollege: false })).toBe(false);
    expect(isEligibleNominee({ ...nominee, membershipActive: false })).toBe(false);
    expect(isEligibleNominee({ ...nominee, userActive: false })).toBe(false);
  });
});
