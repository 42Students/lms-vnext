import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { authAuditTag, safeAuthAuditFields } from "@/modules/auth/auth-audit-privacy";

const secret = "K".repeat(48);

describe("auth audit correlation identifiers", () => {
  it("uses a keyed and purpose-separated tag, not a guessable plain hash", () => {
    const ip = "198.51.100.72";
    const tag = authAuditTag("ip", ip, secret);
    expect(tag).toMatch(/^[0-9a-f]{24}$/);
    expect(tag).not.toBe(createHash("sha256").update(ip).digest("hex").slice(0, 24));
    expect(tag).toBe(authAuditTag("ip", ip, secret));
    expect(tag).not.toBe(authAuditTag("user", ip, secret));
    expect(tag).not.toBe(authAuditTag("ip", ip, "Z".repeat(48)));
  });

  it("does not expose raw addresses or user IDs when a key is unavailable", () => {
    expect(authAuditTag("ip", "198.51.100.72", "short")).toBe("unavailable");
    expect(safeAuthAuditFields({ userId: "person-123" }, "short")).toEqual({});
  });

  it("keeps only approved audit fields with bounded values", () => {
    const input = {
      channel: "EMAIL", requests: 2, accepted: true,
      userId: "11111111-1111-4111-8111-111111111111",
      extra: "not-allowed", route: "/forged", ipTag: "forged",
    };
    expect(safeAuthAuditFields(input, secret)).toEqual({
      channel: "EMAIL", requests: 2, accepted: true,
      userTag: authAuditTag("user", input.userId, secret),
    });
    expect(safeAuthAuditFields({
      channel: "ADMIN", requests: 1.5, elapsedMs: Infinity, accepted: 1,
    }, secret)).toEqual({});
  });
});
