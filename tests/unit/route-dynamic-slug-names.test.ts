import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.join(process.cwd(), "src", "app");

function collectConflicts(dir: string, conflicts: string[]) {
  const entries = readdirSync(dir).filter((name) => statSync(path.join(dir, name)).isDirectory());
  const dynamic = entries.filter((name) => /^\[(\.\.\.)?\[?[^\]]+\]\]?$/.test(name));
  const names = new Set(dynamic.map((name) => name.replace(/^\[+(\.\.\.)?/, "").replace(/\]+$/, "")));
  if (names.size > 1) {
    conflicts.push(`${path.relative(appRoot, dir) || "."}: ${dynamic.join(" vs ")}`);
  }
  for (const name of entries) collectConflicts(path.join(dir, name), conflicts);
}

describe("app router dynamic segments", () => {
  it("never uses two different slug names at the same path level (Next fails at runtime)", () => {
    const conflicts: string[] = [];
    collectConflicts(appRoot, conflicts);
    expect(conflicts).toEqual([]);
  }, 60_000);
});
