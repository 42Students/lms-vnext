import { describe, expect, it } from "vitest";
import {
  collegeContactProfileChanged,
  collegeContactProfileInputSchema,
} from "@/modules/colleges/college-contact-profile-model";

const good = {
  collegeName: "Example Institute",
  supportEmail: "help@example.edu",
  supportPhone: "+91 98765 43210",
  termsUrl: "https://example.edu/terms",
  privacyUrl: "https://example.edu/privacy",
  expectedVersion: 1,
  confirm: true,
};

describe("College contact profile model", () => {
  it("validates public-only contact fields and normalizes whitespace", () => {
    expect(collegeContactProfileInputSchema.parse({
      ...good, collegeName: "  Example Institute  ",
    }).collegeName).toBe("Example Institute");
    expect(collegeContactProfileInputSchema.safeParse({
      ...good, collegeId: "20000000-0000-4000-8000-000000000002",
    }).success).toBe(false);
    expect(collegeContactProfileInputSchema.safeParse({
      ...good, logoUrl: "https://example.edu/logo.png",
    }).success).toBe(false);
    expect(collegeContactProfileInputSchema.safeParse({
      ...good, confirm: false,
    }).success).toBe(false);
  });

  it("rejects insecure links, empty names and malformed version", () => {
    expect(collegeContactProfileInputSchema.safeParse({
      ...good, termsUrl: "http://example.edu/terms",
    }).success).toBe(false);
    expect(collegeContactProfileInputSchema.safeParse({
      ...good, collegeName: " ",
    }).success).toBe(false);
    expect(collegeContactProfileInputSchema.safeParse({
      ...good, expectedVersion: -1,
    }).success).toBe(false);
  });

  it("detects a field change without comparing unrelated branding", () => {
    const before = collegeContactProfileInputSchema.parse(good);
    expect(collegeContactProfileChanged(before, before)).toBe(false);
    expect(collegeContactProfileChanged(before, {
      ...before, supportEmail: null,
    })).toBe(true);
  });
});
