import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// A "use client" or "use server" directive that follows an import fails the whole production build
// (Turbopack). Automated import insertion is the usual cause, so check every source file.
describe("module directives", () => {
  it("come before any import or statement", () => {
    const files = execFileSync("git", ["ls-files", "-z", "--", "src"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\0").filter((p) => /\.(tsx|ts)$/.test(p));
    const bad: string[] = [];
    for (const path of files) {
      const text = readFileSync(path, "utf8");
      const directive = /^(["'])use (client|server)\1;?/m.exec(text);
      if (!directive) continue;
      const before = text.slice(0, directive.index).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").trim();
      if (before) bad.push(`${path}: "${before.slice(0, 60).replace(/\s+/g, " ")}" precedes the directive`);
    }
    expect(bad).toEqual([]);
  }, 60_000);
});
