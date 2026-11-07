import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import {
  BASE_SECURITY_HEADERS,
  PRIVATE_API_HEADERS,
} from "@/security/headers";

describe("private API response cache isolation", () => {
  it("requires private and no-store instead of a public/cacheable default", () => {
    const policy = PRIVATE_API_HEADERS.find(
      (header) => header.key.toLowerCase() === "cache-control",
    )?.value;
    const directives = (policy ?? "")
      .toLowerCase()
      .split(",")
      .map((part) => part.trim());

    expect(directives).toContain("private");
    expect(directives).toContain("no-store");
    expect(directives).not.toContain("public");
    expect(directives).not.toContain("immutable");
  });

  it("applies the policy to every /api path through Next configuration", async () => {
    const rules = await nextConfig.headers?.();
    expect(rules).toBeDefined();

    const apiRules = rules?.filter((rule) => rule.source === "/api/:path*");
    expect(apiRules).toHaveLength(1);

    const values = new Map<string, string>(
      (apiRules?.[0]?.headers ?? []).map(
        (header) => [header.key.toLowerCase(), header.value] as const,
      ),
    );
    const cacheControl = (values.get("cache-control") ?? "")
      .toLowerCase()
      .split(",")
      .map((part) => part.trim());

    expect(cacheControl).toContain("private");
    expect(cacheControl).toContain("no-store");

    // A later narrower authentication rule must not accidentally restore
    // a cacheable policy or mask the global API response rule.
    const contradictoryRules = (rules ?? []).filter(
      (rule) =>
        rule.source.startsWith("/api/") &&
        rule.source !== "/api/:path*" &&
        rule.headers.some((header) =>
          header.key.toLowerCase() === "cache-control" &&
          !header.value.toLowerCase().includes("no-store"),
        ),
    );
    expect(contradictoryRules).toHaveLength(0);
  });

  it("retains baseline security headers for API responses", async () => {
    const rules = await nextConfig.headers?.();
    const rootRules = rules?.filter((rule) => rule.source === "/:path*");
    expect(rootRules).toHaveLength(1);

    for (const criticalName of [
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
    ]) {
      expect(
        rootRules?.[0]?.headers.some(
          (header) => header.key.toLowerCase() === criticalName,
        ),
      ).toBe(true);
      expect(
        BASE_SECURITY_HEADERS.some(
          (header) => header.key.toLowerCase() === criticalName,
        ),
      ).toBe(true);
    }
  });
});

describe("private API cross-origin resource policy", () => {
  it("answers same-origin only", () => {
    expect(PRIVATE_API_HEADERS.find((h) => h.key === "Cross-Origin-Resource-Policy")?.value).toBe("same-origin");
  });
});
