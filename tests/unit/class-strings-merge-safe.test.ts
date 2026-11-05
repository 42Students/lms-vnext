import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { twMerge } from "tailwind-merge";

const classy = (w: string) => /^[A-Za-z0-9[\]:_().,%#!/&>*=@+-]+$/.test(w);

// cx() runs every class list through tailwind-merge. If merging would silently remove a class from a
// literal class list, either the list has a dead duplicate or the merger groups two different
// properties together (the text-[var(--lms-font-*)] size/color mistake). Both must be fixed in the source.
const HARMLESS = [
  (gone: string, all: string[]) => gone === "block" && all.some((w) => /^line-clamp-/.test(w)),
  (gone: string, all: string[]) => /basis-auto$/.test(gone) && all.some((w) => /flex-none$/.test(w)),
];

describe("class strings are safe to merge", () => {
  it("no literal class list loses a class to cx()", () => {
    const files = execFileSync("git", ["ls-files", "-z", "--", "src"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\0").filter((p) => /\.(tsx|ts)$/.test(p) && !/\.(test|spec)\./.test(p));
    const problems: string[] = [];
    for (const path of files) {
      const text = readFileSync(path, "utf8");
      for (const m of text.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`$]*)`/g)) {
        const body = m[1] ?? m[2] ?? m[3];
        if (!body || body.length < 9) continue;
        const words = body.split(/\s+/).filter(Boolean);
        if (words.length < 2 || !words.every(classy)) continue;
        const merged = twMerge(words.join(" ")).split(/\s+/).filter(Boolean);
        if (merged.length >= words.length) continue;
        const gone = words.filter((w) => !merged.includes(w) && words.filter((x) => x === w).length === 1);
        for (const g of gone) {
          if (HARMLESS.some((ok) => ok(g, words))) continue;
          if (/^(?:[a-z-]+:)*border-\[var\(--lms-[a-z-]+\)\]$/.test(g) && words.some((w) => /^(?:[a-z-]+:)*border-/.test(w) && w !== g)) continue;
          problems.push(`${path}: "${g}" in "${body.slice(0, 80)}"`);
        }
      }
    }
    expect(problems).toEqual([]);
  }, 120_000);
});
