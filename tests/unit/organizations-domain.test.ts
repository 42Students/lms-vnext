import { describe, expect, it } from "vitest";
import {
  createOrganizationInputSchema,
  renameOrganizationInputSchema,
} from "@/modules/organizations/validation";

describe("organizations domain", () => {
  it("normalizes organization names", () => {
    expect(
      createOrganizationInputSchema.parse({
        name: "  42 Education Group  ",
      }),
    ).toEqual({
      name: "42 Education Group",
    });

    expect(
      renameOrganizationInputSchema.parse({
        name: "  42 Students  ",
      }),
    ).toEqual({
      name: "42 Students",
    });
  });

  it("rejects blank names", () => {
    expect(() =>
      createOrganizationInputSchema.parse({
        name: "   ",
      }),
    ).toThrow();
  });
});
