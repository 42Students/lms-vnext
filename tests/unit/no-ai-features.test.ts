import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Owner decision 12 (2026-10-15): Vertex AI and all AI features are dropped.
const srcRoot = path.resolve(__dirname, "../../src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("no AI features in src", () => {
  it("has no src/ai directory", () => {
    expect(existsSync(path.join(srcRoot, "ai"))).toBe(false);
  });

  it("no source file references vertex or ai-grading", () => {
    const offenders = walk(srcRoot).filter((file) =>
      /vertex|ai-grading/i.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  }, 60_000);
});
