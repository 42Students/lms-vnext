import { describe, expect, it } from "vitest";
import { learnerContactEditSchema } from "@/modules/people/learner-contact-model";

describe("Learner contact-only edit validation", () => {
  const valid = { confirmed: true as const, contacts: {
    alternatePhone: "919876543210", contactEmail: "learner@example.test",
  } };
  it("permits confirmed, properly formatted alternate contact fields", () => {
    expect(learnerContactEditSchema.parse(valid)).toEqual(valid);
    expect(learnerContactEditSchema.parse({ confirmed: true, contacts: {
      alternatePhone: "", contactEmail: "",
    } }).contacts).toEqual({ alternatePhone: "", contactEmail: "" });
  });
  it("rejects unconfirmed, malformed, and privileged account-field updates", () => {
    for (const value of [
      { ...valid, confirmed: false },
      { contacts: valid.contacts },
      { ...valid, contacts: { alternatePhone: "1", contactEmail: "email" } },
      { ...valid, contacts: { ...valid.contacts, alternatePhone: "+91 +9876543210" } },
      { ...valid, contacts: { ...valid.contacts, accountEmail: "other@example.test" } },
      { ...valid, userId: "forged" },
      { ...valid, membershipId: "forged" },
      { ...valid, collegeId: "forged" },
      { ...valid, contacts: { ...valid.contacts, alternatePhone: "9".repeat(33) } },
      { ...valid, contacts: { ...valid.contacts, contactEmail: "x".repeat(321) } },
    ]) {
      expect(learnerContactEditSchema.safeParse(value).success).toBe(false);
    }
  });
});
