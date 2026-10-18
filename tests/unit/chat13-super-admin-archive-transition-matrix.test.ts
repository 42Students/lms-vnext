import { describe, expect, it } from "vitest";
import {
  canArchiveDriveWithImpact,
  sameArchiveImpact,
  superAdminArchiveCommandSchema,
} from "@/modules/placements/super-admin-drive-archive-model";

const impact = {
  activeApplications: 3,
  affectedLearners: 2,
  openRounds: 1,
  issuedOffers: 1,
  acceptedOffers: 0,
};

describe("chat-13 destructive Super Admin drive archive transition matrix", () => {
  it("SA-DRIVE-ARCHIVE-04 rejects unknown and terminal statuses before archive regardless of accepted-offer count", () => {
    const eligible = ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"] as const;
    for (const status of eligible) {
      expect(canArchiveDriveWithImpact(status, impact), status).toBe(true);
      expect(canArchiveDriveWithImpact(status, { ...impact, acceptedOffers: 1 }), status).toBe(false);
      expect(canArchiveDriveWithImpact(status, { ...impact, acceptedOffers: 2 }), status).toBe(false);
    }
    for (const status of [
      "ARCHIVED", "DELETED", "REOPENED", "PAUSED",
      "PUBLISHING", "", "DRAFT ", "published",
    ]) {
      expect(canArchiveDriveWithImpact(status, impact), status).toBe(false);
    }
  });

  it("SA-DRIVE-ARCHIVE-05 rejects stale impact preview and untrusted command payloads", () => {
    expect(sameArchiveImpact(impact, { ...impact })).toBe(true);
    for (const changed of [
      { ...impact, activeApplications: 4 },
      { ...impact, affectedLearners: 3 },
      { ...impact, openRounds: 2 },
      { ...impact, issuedOffers: 2 },
      { ...impact, acceptedOffers: 1 },
    ]) expect(sameArchiveImpact(impact, changed)).toBe(false);

    const command = {
      confirmed: true,
      expectedUpdatedAt: "2099-04-18T00:00:00.000+05:30",
      reason: "This drive is being archived after official approval.",
      expectedImpact: impact,
    };
    expect(superAdminArchiveCommandSchema.safeParse(command).success).toBe(true);
    for (const bad of [
      { ...command, confirmed: false },
      { ...command, reason: " " },
      { ...command, expectedImpact: { ...impact, acceptedOffers: -1 } },
      { ...command, expectedImpact: { ...impact, injected: true } },
      { ...command, expectedUpdatedAt: "not a timestamp" },
      { ...command, selectedCollege: "foreign" },
    ]) expect(superAdminArchiveCommandSchema.safeParse(bad).success).toBe(false);
  });
});
