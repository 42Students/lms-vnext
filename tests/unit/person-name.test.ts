import { describe, expect, it } from "vitest";
import {
  displayNameFromPersonName,
  personNameSchema,
} from "@/modules/people/person-name";

describe("DB01 canonical person-name contract", () => {
  it("preserves exact given/family fields and derives display name", () => {
    const name = personNameSchema.parse({
      givenName: "Akhila",
      familyName: "G. J. V.",
    });
    expect(name).toEqual({
      givenName: "Akhila",
      familyName: "G. J. V.",
    });
    expect(displayNameFromPersonName(name)).toBe("Akhila G. J. V.");
  });

  it("supports Unicode names without allowing control characters", () => {
    expect(
      personNameSchema.parse({
        givenName: "ఫణీంద్ర",
        familyName: "బసవపురపు",
      }).givenName,
    ).toBe("ఫణీంద్ర");

    expect(() =>
      personNameSchema.parse({
        givenName: "Bad\nName",
        familyName: "",
      }),
    ).toThrow();
  });

  it("keeps family name optional without parsing displayName", () => {
    const name = personNameSchema.parse({
      givenName: "Madonna",
    });
    expect(name.familyName).toBe("");
    expect(displayNameFromPersonName(name)).toBe("Madonna");
  });
});
