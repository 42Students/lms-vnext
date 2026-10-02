import { describe, expect, it } from "vitest";
import {
  createTenantDomainInputSchema,
  normalizeRequestHost,
  normalizeTenantHost,
} from "@/modules/tenant-domains/validation";

describe("tenant-domain validation", () => {
  it("normalizes configured DNS hosts deterministically", () => {
    expect(normalizeTenantHost("  College.Example.EDU. ")).toBe(
      "college.example.edu",
    );

    expect(
      createTenantDomainInputSchema.parse({
        collegeId: "11111111-1111-4111-8111-111111111111",
        host: " PORTAL.Example.edu ",
      }),
    ).toEqual({
      collegeId: "11111111-1111-4111-8111-111111111111",
      host: "portal.example.edu",
    });
  });

  it("rejects URLs, ports, localhost and IP addresses as configured hosts", () => {
    for (const value of [
      "https://college.example.edu",
      "college.example.edu/path",
      "college.example.edu:8443",
      "localhost",
      "127.0.0.1",
    ]) {
      expect(() => normalizeTenantHost(value)).toThrow();
    }
  });

  it("normalizes an incoming Host header while ignoring its port", () => {
    expect(normalizeRequestHost("College.Example.edu:443")).toBe(
      "college.example.edu",
    );
  });
});
