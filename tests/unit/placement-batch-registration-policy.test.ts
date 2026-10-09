import { describe, expect, it } from "vitest";
import {
  createRegistrationWrite,
  isDebarmentActive,
  PLACEMENT_REGISTRATION_CONSENT_VERSION,
  resolveRegistrationWindow,
} from "@/modules/placements/batch-registration-policy";

const now = new Date("2026-10-10T09:00:00.000Z");
const invitation = new Date("2026-10-09T09:00:00.000Z");

describe("DB08-B batch registration window", () => {
  it("fails closed when a batch has not started", () => {
    expect(resolveRegistrationWindow(null, now).open).toBe(false);
    expect(resolveRegistrationWindow({
      invitedAt: null, finishedAt: null, deadline: null,
    }, now).open).toBe(false);
  });

  it("opens only after invitation and before an exclusive deadline", () => {
    expect(resolveRegistrationWindow({
      invitedAt: invitation, finishedAt: null,
      deadline: new Date("2026-10-10T09:00:01Z"),
    }, now).open).toBe(true);
    expect(resolveRegistrationWindow({
      invitedAt: invitation, finishedAt: null, deadline: now,
    }, now).open).toBe(false);
  });

  it("permits an invited cohort with no deadline, but not a finished one", () => {
    expect(resolveRegistrationWindow({
      invitedAt: invitation, finishedAt: null, deadline: null,
    }, now).open).toBe(true);
    expect(resolveRegistrationWindow({
      invitedAt: invitation,
      finishedAt: new Date("2026-10-10T08:00:00Z"),
      deadline: new Date("2026-11-01T00:00:00Z"),
    }, now).open).toBe(false);
  });
});

describe("DB08-B consent, choice, version retention", () => {
  it("requires explicit acceptance for Placements", () => {
    expect(() => createRegistrationWrite({
      choice: "PLACEMENTS", acceptedConsent: false, now,
    })).toThrow("DB08_REGISTRATION_CONSENT_REQUIRED");
    expect(createRegistrationWrite({
      choice: "PLACEMENTS", acceptedConsent: true, now,
    })).toEqual({
      choice: "PLACEMENTS",
      consentVersion: PLACEMENT_REGISTRATION_CONSENT_VERSION,
      consentAt: now,
    });
  });

  it("never records placement consent for Higher Studies or Not Interested", () => {
    for (const choice of ["HIGHER_STUDIES", "NOT_INTERESTED"] as const) {
      expect(createRegistrationWrite({
        choice, acceptedConsent: false, now,
      })).toEqual({
        choice, consentVersion: null, consentAt: null,
      });
      expect(() => createRegistrationWrite({
        choice, acceptedConsent: true, now,
      })).toThrow("DB08_REGISTRATION_CONSENT_NOT_APPLICABLE");
    }
  });
});

describe("DB08-B duration and counted-drive debarment parity", () => {
  const base = {
    liftedAt: null, untilDate: null, untilDrives: null, drivesCounted: 0,
  };

  it("treats no configured end as indefinite", () => {
    expect(isDebarmentActive(base, "2026-10-10")).toBe(true);
  });

  it("treats until_date as inclusive and with precedence over until_drives", () => {
    expect(isDebarmentActive({
      ...base, untilDate: "2026-10-10", untilDrives: 1, drivesCounted: 5,
    }, "2026-10-10")).toBe(true);
    expect(isDebarmentActive({
      ...base, untilDate: "2026-10-10", untilDrives: 1, drivesCounted: 0,
    }, "2026-10-11")).toBe(false);
  });

  it("ends a drive-count limit once the Nth distinct drive is counted", () => {
    expect(isDebarmentActive({
      ...base, untilDrives: 3, drivesCounted: 2,
    }, "2026-10-10")).toBe(true);
    expect(isDebarmentActive({
      ...base, untilDrives: 3, drivesCounted: 3,
    }, "2026-10-10")).toBe(false);
  });

  it("manual lift immediately ends all duration modes", () => {
    expect(isDebarmentActive({
      ...base, liftedAt: new Date("2026-10-09"),
    }, "2026-10-10")).toBe(false);
  });
});
