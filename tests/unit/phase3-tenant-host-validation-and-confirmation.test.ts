import { describe, expect, it } from "vitest";
import {
  createTenantDomainInputSchema,
  normalizeRequestHost,
  normalizeTenantHost,
  tenantDomainHostSchema,
} from "@/modules/tenant-domains/validation";
import {
  availableSubdomainLabel,
  subdomainLabelSchema,
  subdomainMoveInputSchema,
} from "@/modules/tenant-domains/college-subdomain-model";
import { canConfirmPrimaryDomainDelete } from "@/modules/tenant-domains/admin-confirmation-model";

const UUID = "22222222-2222-4222-8222-222222222222";

describe("Phase 3: tenant host mapping is the Super Admin's sharpest tool, so it validates hard", () => {
  describe("normalizeTenantHost accepts only a plain fully qualified DNS name", () => {
    it("lower-cases, trims and removes a trailing dot", () => {
      expect(normalizeTenantHost("  Learn.College.EDU. ")).toBe("learn.college.edu");
    });
    it("keeps multi-label hosts intact", () => {
      expect(normalizeTenantHost("nsrit.development.42lms.com")).toBe("nsrit.development.42lms.com");
    });
    it("returns ASCII even for an internationalised name", () => {
      const host = normalizeTenantHost("bücher.example.com");
      expect(host).toMatch(/^[a-z0-9.-]+$/);
      expect(host.startsWith("xn--")).toBe(true);
    });

    const rejected: Array<[string, string]> = [
      ["empty", ""],
      ["whitespace only", "   "],
      ["a URL", "https://college.edu"],
      ["a URL with path", "college.edu/login"],
      ["a port", "college.edu:8443"],
      ["the default https port", "college.edu:443"],
      ["credentials", "user@college.edu"],
      ["a query", "college.edu?x=1"],
      ["a fragment", "college.edu#top"],
      ["a backslash", "college.edu\\evil.com"],
      ["a null byte", "college.edu\u0000.evil.com"],
      ["a control character", "college\u0007.edu"],
      ["a single label", "intranet"],
      ["localhost", "localhost"],
      ["an IPv4 address", "10.0.0.5"],
      ["a loopback IP", "127.0.0.1"],
      ["an underscore label", "my_college.example.com"],
      ["a leading hyphen label", "-college.example.com"],
      ["a trailing hyphen label", "college-.example.com"],
      ["an empty label", "college..edu"],
      ["a label over 63 characters", `${"a".repeat(64)}.example.com`],
      ["a name over 253 characters", `${"a".repeat(60)}.${"b".repeat(60)}.${"c".repeat(60)}.${"d".repeat(60)}.${"e".repeat(20)}.com`],
      ["only dots", "..."],
    ];
    for (const [name, value] of rejected) {
      it(`rejects ${name}`, () => {
        expect(() => normalizeTenantHost(value)).toThrow();
      });
    }
  });

  describe("normalizeRequestHost strips the port a real request carries but nothing else", () => {
    it("accepts a request host with a port and normalises it", () => {
      expect(normalizeRequestHost("Learn.College.edu:3000")).toBe("learn.college.edu");
    });
    it("still rejects a smuggled path, credentials or scheme", () => {
      for (const value of ["college.edu/evil", "a@college.edu", "https://college.edu", "college.edu\\x"]) {
        expect(() => normalizeRequestHost(value), value).toThrow();
      }
    });
    it("still rejects a host that is not fully qualified", () => {
      expect(() => normalizeRequestHost("localhost:3000")).toThrow();
      expect(() => normalizeRequestHost("127.0.0.1:3000")).toThrow();
    });
  });

  describe("schemas wrap the normaliser", () => {
    it("tenantDomainHostSchema turns a bad host into a validation issue, not an exception", () => {
      expect(tenantDomainHostSchema.safeParse("https://x.edu").success).toBe(false);
      expect(tenantDomainHostSchema.safeParse("Good.College.edu").data).toBe("good.college.edu");
    });
    it("createTenantDomainInputSchema requires a valid college id and host", () => {
      expect(createTenantDomainInputSchema.safeParse({ collegeId: "nope", host: "a.college.edu" }).success).toBe(false);
      expect(createTenantDomainInputSchema.safeParse({ collegeId: UUID, host: "localhost" }).success).toBe(false);
    });
  });

  describe("managed college subdomain labels", () => {
    it("accepts ordinary labels and lower-cases them", () => {
      expect(subdomainLabelSchema.parse("  NSRIT-Hyd ")).toBe("nsrit-hyd");
      expect(availableSubdomainLabel("nsrit")).toBe(true);
    });
    it("reserves the platform's own names", () => {
      for (const label of ["admin", "api", "www", "mail", "auth", "support", "static"]) {
        expect(availableSubdomainLabel(label), label).toBe(false);
      }
    });
    it("rejects reserved names regardless of case or padding", () => {
      expect(availableSubdomainLabel(" ADMIN ")).toBe(false);
    });
    it("rejects labels that are too short, too long or malformed", () => {
      for (const label of ["ab", "a".repeat(64), "-abc", "abc-", "ab_c", "a.b.c", "abc.", "ab c", "ünï"]) {
        expect(availableSubdomainLabel(label), label).toBe(false);
      }
    });
    it("a subdomain move is a strict command that carries an expected version", () => {
      const ok = { collegeId: UUID, label: "nsrit", expectedVersion: 3 };
      expect(subdomainMoveInputSchema.safeParse(ok).success).toBe(true);
      expect(subdomainMoveInputSchema.safeParse({ ...ok, organizationId: UUID }).success).toBe(false);
      expect(subdomainMoveInputSchema.safeParse({ ...ok, expectedVersion: -1 }).success).toBe(false);
      expect(subdomainMoveInputSchema.safeParse({ ...ok, expectedVersion: 1.5 }).success).toBe(false);
      expect(subdomainMoveInputSchema.safeParse({ collegeId: UUID, label: "nsrit" }).success).toBe(false);
      expect(subdomainMoveInputSchema.safeParse({ ...ok, collegeId: "x" }).success).toBe(false);
    });
  });

  describe("deleting a primary domain needs the exact hostname typed", () => {
    it("accepts the exact host", () => {
      expect(canConfirmPrimaryDomainDelete("learn.college.edu", "learn.college.edu")).toBe(true);
    });
    it("rejects a different case, padding, a prefix, empty input or an empty host", () => {
      expect(canConfirmPrimaryDomainDelete("learn.college.edu", "Learn.College.edu")).toBe(false);
      expect(canConfirmPrimaryDomainDelete("learn.college.edu", " learn.college.edu")).toBe(false);
      expect(canConfirmPrimaryDomainDelete("learn.college.edu", "learn.college.ed")).toBe(false);
      expect(canConfirmPrimaryDomainDelete("learn.college.edu", "")).toBe(false);
      expect(canConfirmPrimaryDomainDelete("", "")).toBe(false);
    });
  });
});
