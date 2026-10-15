import { describe, expect, it } from "vitest";
import { parseAuthTestAllowlist } from "@/modules/messaging/allowlist";

describe("auth test recipient allowlists", () => {
  it("normalizes email and deduplicates configured recipients", () => {
    expect(parseAuthTestAllowlist({ emailAddresses: " A@EXAMPLE.COM,a@example.com,wrong ", phoneNumbers: "+919999999999,+919999999999,invalid" }))
      .toEqual({ testEmails: ["a@example.com"], testPhones: ["+919999999999"] });
  });
  it("defaults to deny-everyone when no allowlist is provided", () => {
    expect(parseAuthTestAllowlist({})).toEqual({ testEmails: [], testPhones: [] });
  });
});
