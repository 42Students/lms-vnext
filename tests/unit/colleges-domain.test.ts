import { describe, expect, it } from "vitest";
import {
  createCollegeInputSchema,
  updateCollegeInputSchema,
} from "@/modules/colleges/validation";

describe("colleges domain", () => {
  it("normalizes names and codes without allowing ownership changes in updates", () => {
    expect(
      createCollegeInputSchema.parse({
        organizationId: "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0",
        name: "  Example Engineering College  ",
        code: "  EEC  ",
      }),
    ).toMatchObject({
      name: "Example Engineering College",
      code: "EEC",
    });

    expect(
      updateCollegeInputSchema.parse({
        name: "  Updated College  ",
      }),
    ).toEqual({
      name: "Updated College",
    });
  });

  it("rejects empty updates", () => {
    expect(() => updateCollegeInputSchema.parse({})).toThrow();
  });
});
