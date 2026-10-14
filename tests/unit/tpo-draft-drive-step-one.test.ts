import { describe, expect, it } from "vitest";
import {
  normalizedTpoDraftDeadline,
  tpoDraftDriveStepOneSchema,
} from "@/modules/placements/tpo-draft-drive-model";

const uuid = "00000000-0000-4000-8000-000000000001";
const payload = {
  confirmed: true as const,
  companyRelationshipId: uuid,
  seasonId: uuid,
  title: "  Backend Developer  ",
  description: "  First round placements  ",
  employmentType: "FULL_TIME" as const,
  workMode: "ONSITE" as const,
  applicationDeadline: "2026-12-18T09:30:00+05:30",
};

describe("TPO quick draft step-one contract", () => {
  it("normalizes role fields and retains an explicit IST offset", () => {
    const value = tpoDraftDriveStepOneSchema.parse(payload);
    expect(value.title).toBe("Backend Developer");
    expect(value.description).toBe("First round placements");
    expect(value.applicationDeadline).toBe("2026-12-18T09:30:00+05:30");
    expect(normalizedTpoDraftDeadline(value.applicationDeadline)?.toISOString())
      .toBe("2026-12-18T04:00:00.000Z");
  });

  it("rejects implicit timezone, invalid dates, missing confirmation and forged tenant", () => {
    expect(tpoDraftDriveStepOneSchema.safeParse({
      ...payload, applicationDeadline: "2026-12-18T09:30:00",
    }).success).toBe(false);
    expect(tpoDraftDriveStepOneSchema.safeParse({
      ...payload, applicationDeadline: "2026-15-99T09:30:00+05:30",
    }).success).toBe(false);
    expect(tpoDraftDriveStepOneSchema.safeParse({
      ...payload, applicationDeadline: "2020-01-01T09:30:00+05:30",
    }).success).toBe(false);
    expect(tpoDraftDriveStepOneSchema.safeParse({
      ...payload, confirmed: false,
    }).success).toBe(false);
    expect(tpoDraftDriveStepOneSchema.safeParse({
      ...payload, collegeId: uuid,
    }).success).toBe(false);
    expect(tpoDraftDriveStepOneSchema.safeParse({
      ...payload, roleOptionId: uuid,
    }).success).toBe(false);
  });
});
