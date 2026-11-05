import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const doc = JSON.parse(readFileSync("docs/design-system/UI-CONSISTENCY-EXEMPTIONS.json", "utf8")) as { files: Record<string, { reason: string; pinnedBy: string[] }> };

describe("ui consistency exemptions", () => {
  it("stay small, real and justified", () => {
    const entries = Object.entries(doc.files);
    expect(entries.length).toBeLessThanOrEqual(5);
    for (const [path, entry] of entries) {
      expect(existsSync(path), path).toBe(true);
      expect(entry.reason.length, path).toBeGreaterThan(5);
      expect(entry.pinnedBy.length, path).toBeGreaterThan(0);
      for (const test of entry.pinnedBy) expect(existsSync(`tests/unit/${test}.test.ts`), test).toBe(true);
    }
  });
});
