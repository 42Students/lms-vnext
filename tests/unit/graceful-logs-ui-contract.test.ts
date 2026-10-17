import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { friendlyApiError } from "@/lib/friendly-error";

describe("known error triage UI resilience", () => {
  it("GR-123 uses guarded actions and safe apiFetch for all Logs mutations", () => {
    const source = readFileSync("src/components/tracker/known-errors-workspace.tsx", "utf8");
    expect(source).toContain('from "@/hooks/use-guarded-action"');
    expect(source).toContain('from "@/lib/api-fetch"');
    expect(source).toContain("await run(async () =>");
    expect(source).toContain('action: "ACKNOWLEDGE"');
    expect(source).toContain('status: "FIXED"');
    expect(source).toContain('action: "MUTE"');
    expect(source).not.toMatch(/\bawait fetch\(/);
    expect(source).not.toContain("error.message :");
  });
  it("GR-124 shows plain errors rather than raw codes for expected admin failures", () => {
    for (const [status, code] of [[400, "INVALID_REQUEST"], [403, "FORBIDDEN"], [404, "KNOWN_ERROR_NOT_FOUND"]] as const) {
      expect(friendlyApiError({ status, code })).not.toBe(code);
      expect(friendlyApiError({ status, code })).not.toMatch(/^[A-Z][A-Z0-9_]{5,}$/);
    }
  });
});
