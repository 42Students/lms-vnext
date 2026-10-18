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
      "college.example.edu:443",
      "college.example.edu:80",
      "localhost",
      "127.0.0.1",
    ]) {
      expect(() => normalizeTenantHost(value)).toThrow();
    }
  });

  it("WEAK-tenant-domains-06 rejects slash-like and control-contaminated domain claims", () => {
    for(const host of [
      "college.example.edu\\other.example.edu",
      "college.example.edu\\@other.example.edu",
      "college.example.edu\t.evil.test",
      "college.example.edu\n.evil.test",
      "college.example.edu\r.evil.test",
      "college.example.edu\u007f.evil.test",
    ]) {
      expect(() => normalizeTenantHost(host)).toThrow();
      expect(() => normalizeRequestHost(host)).toThrow();
      expect(createTenantDomainInputSchema.safeParse({
        collegeId:"11111111-1111-4111-8111-111111111111",host,
      }).success).toBe(false);
    }
    expect(normalizeRequestHost("COLLEGE.Example.edu:8443")).toBe("college.example.edu");
  });

  it("normalizes an incoming Host header while ignoring its port", () => {
    expect(normalizeRequestHost("College.Example.edu:443")).toBe(
      "college.example.edu",
    );
  });
});
