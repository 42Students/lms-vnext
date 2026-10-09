import { describe, expect, it } from "vitest";
import {
  placementBatchInputSchema,
  placementRegistrationInputSchema,
  placementDebarmentInputSchema,
  placementExternalOutcomeInputSchema,
} from "@/modules/placements/db08-lifecycle-validation";
import {
  resolvePlacementDebarmentState,
} from "@/modules/placements/db08-debarment-service";

const collegeId = "20000000-0000-4000-8000-000000000001";
const cohortId = "50000000-0000-4000-8000-000000000001";
const seasonId = "22000000-0000-4000-8000-000000000001";
const membershipId = "40000000-0000-4000-8000-000000000004";

describe("DB08-B cohort placement lifecycle contracts", () => {
  it("preserves null deadline/rules instead of inventing an invitation", () => {
    const v = placementBatchInputSchema.parse({ collegeId, cohortId });
    expect(v.registrationDeadline).toBeUndefined();
    expect(v.rulesOverride).toBeUndefined();
  });
  it("requires timezone-aware deadline and a UUID cohort", () => {
    expect(() => placementBatchInputSchema.parse({
      collegeId, cohortId,
      registrationDeadline: "2026-10-10T15:00:00",
    })).toThrow();
    expect(placementBatchInputSchema.parse({
      collegeId, cohortId,
      registrationDeadline: "2026-10-10T15:00:00+05:30",
    }).registrationDeadline).toBe("2026-10-10T15:00:00+05:30");
  });
});

describe("DB08-B registration and consent", () => {
  it("preserves placement, higher studies and uninterested as distinct outcomes", () => {
    for (const choice of ["PLACEMENTS", "HIGHER_STUDIES", "NOT_INTERESTED"] as const) {
      expect(placementRegistrationInputSchema.parse({
        collegeId, seasonId, membershipId, choice,
      }).choice).toBe(choice);
    }
  });
  it("rejects unsupported registration states and overly long consent versions", () => {
    expect(() => placementRegistrationInputSchema.parse({
      collegeId, seasonId, membershipId, choice: "PENDING",
    })).toThrow();
    expect(() => placementRegistrationInputSchema.parse({
      collegeId, seasonId, membershipId, choice: "PLACEMENTS",
      consentVersion: "version-2026-10-10",
    })).toThrow();
  });
});

describe("DB08-C debarment", () => {
  it("supports indefinite, date and N-drive holds without mixing expiry mechanisms", () => {
    expect(placementDebarmentInputSchema.parse({
      collegeId, membershipId, reason: "  Disciplinary policy  ",
    }).reason).toBe("Disciplinary policy");
    expect(() => placementDebarmentInputSchema.parse({
      collegeId, membershipId, reason: "Attendance",
      untilDate: "2026-10-11", untilDrives: 3,
    })).toThrow();
  });
  it("keeps end-date inclusive and number-of-drives exclusive", () => {
    const now = new Date("2026-10-11T06:00:00.000Z");
    expect(resolvePlacementDebarmentState({
      liftedAt: null,
      untilDate: "2026-10-11",
      untilDrives: null,
      drivesCounted: 0,
    }, now)).toMatchObject({ active: true });
    expect(resolvePlacementDebarmentState({
      liftedAt: null,
      untilDate: "2026-10-10",
      untilDrives: null,
      drivesCounted: 0,
    }, now)).toMatchObject({ active: false, reason: "DATE_EXPIRED" });
    expect(resolvePlacementDebarmentState({
      liftedAt: null,
      untilDate: null,
      untilDrives: 2,
      drivesCounted: 2,
    }, now)).toMatchObject({ active: false, reason: "DRIVES_COMPLETED" });
    expect(resolvePlacementDebarmentState({
      liftedAt: new Date(),
      untilDate: null,
      untilDrives: null,
      drivesCounted: 0,
    }, now)).toMatchObject({ active: false, reason: "LIFTED" });
  });
});

describe("DB08-D external placement", () => {
  it("keeps verified annual CTC in integer INR, not a float rupee conversion", () => {
    expect(placementExternalOutcomeInputSchema.parse({
      collegeId, membershipId, companyName: "Off-campus Employer",
      annualCtcInr: 1_237_500,
    }).annualCtcInr).toBe(1_237_500);
    expect(() => placementExternalOutcomeInputSchema.parse({
      collegeId, membershipId, companyName: "Off-campus Employer",
      annualCtcInr: 1237500.25,
    })).toThrow();
  });
  it("rejects blank company and unknown writable fields", () => {
    expect(() => placementExternalOutcomeInputSchema.parse({
      collegeId, membershipId, companyName: " ",
    })).toThrow();
    expect(() => placementExternalOutcomeInputSchema.parse({
      collegeId, membershipId, companyName: "Employer",
      verifiedByUserId: "tamper",
    })).toThrow();
  });
});
