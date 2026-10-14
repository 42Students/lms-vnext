import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { timestampTokenIso } from "@/modules/academics/optimistic-timestamp-model";

const root = process.cwd();
const targetPaths = [
  ...["academics", "people"].flatMap(directory =>
    readdirSync(join(root, "src/modules", directory)).filter(name => name.endsWith(".ts"))
      .map(name => join(root, "src/modules", directory, name))),
  ...readdirSync(join(root, "src/modules/placements")).filter(name =>
    /^college-.*\.ts$/.test(name)).map(name => join(root, "src/modules/placements", name)),
];

describe("College Admin optimistic timestamp precision contract", () => {
  it("serializes only real Date tokens as millisecond ISO values", () => {
    expect(timestampTokenIso(new Date("2026-10-14T12:01:02.123Z")))
      .toBe("2026-10-14T12:01:02.123Z");
    expect(() => timestampTokenIso(new Date(Number.NaN))).toThrow();
  });
  it("guards academic, people, and college-placement source from raw updatedAt equality", () => {
    expect(targetPaths.length).toBeGreaterThan(65);
    const unsafe = targetPaths.flatMap(file => {
      const source = readFileSync(file, "utf8");
      return /\beq\(\s*[a-zA-Z0-9_.]+\.updatedAt\s*,|\bupdated_at\s*=\s*\$\d+(?!\s*::)/g.test(source)
        ? [file.replace(root, "")] : [];
    });
    expect(unsafe, "Raw timestamp equality loses Postgres microseconds. Use date_trunc or integer version.").toEqual([]);
  });
});
