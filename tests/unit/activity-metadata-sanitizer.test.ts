import { describe, expect, it } from "vitest";
import { sanitizeActivityMetadata } from "@/modules/activity/metadata-sanitizer";

describe("W06 activity metadata sanitizer", () => {
  it("redacts credentials and identity-secret keys recursively", () => {
    expect(sanitizeActivityMetadata({
      action: "updated",
      apiToken: "secret",
      nested: {
        password: "pw",
        aadhaarNumber: "1234",
        safe: "visible",
      },
      array: [{ authorization: "Bearer secret", value: 2 }],
    })).toEqual({
      action: "updated",
      apiToken: "[REDACTED]",
      nested: {
        password: "[REDACTED]",
        aadhaarNumber: "[REDACTED]",
        safe: "visible",
      },
      array: [{ authorization: "[REDACTED]", value: 2 }],
    });
  });

  it("bounds untrusted strings, arrays and recursive depth", () => {
    const result = sanitizeActivityMetadata({
      huge: "x".repeat(3000),
      many: Array.from({ length: 150 }, (_, i) => i),
      nested: { a: { b: { c: { d: { e: { f: "deep" } } } } } },
    });
    expect(String(result.huge)).toHaveLength(2001);
    expect(result.many).toHaveLength(100);
    expect(JSON.stringify(result)).toContain("[TRUNCATED_DEPTH]");
  });

  it("does not mutate the original metadata", () => {
    const input = { nested: { secret: "raw", safe: "ok" } };
    sanitizeActivityMetadata(input);
    expect(input).toEqual({ nested: { secret: "raw", safe: "ok" } });
  });
});
