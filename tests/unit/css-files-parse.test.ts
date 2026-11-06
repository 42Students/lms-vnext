import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { transform } from "lightningcss";

// Turbopack fails the whole production build on one unparseable stylesheet, and unit tests that only
// read source text cannot see it. This parses every stylesheet with the same parser Next uses.
// Tailwind-only at-rules are rewritten to plain CSS first.
function toPlainCss(code: string) {
  return code
    .replace(/@theme\b[^{]*\{/g, ":root{")
    .replace(/@utility\s+([\w-]+)\s*\{/g, ".u-$1{")
    .replace(/@(source|plugin|custom-variant|config)\b[^;{]*;/g, "")
    .replace(/@apply\b[^;}]*;?/g, "");
}

const files = execFileSync("git", ["ls-files", "-z", "--", "src"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  .split("\0").filter((p) => p.endsWith(".css"));

describe("stylesheets", () => {
  it("every .css file parses", () => {
    const errors: string[] = [];
    for (const path of files) {
      try {
        transform({ filename: path, code: Buffer.from(toPlainCss(readFileSync(path, "utf8"))), cssModules: path.endsWith(".module.css") });
      } catch (error) {
        errors.push(`${path}: ${String((error as Error).message).split("\n")[0]}`);
      }
    }
    expect(errors).toEqual([]);
  });

  it("no custom property name or reference is malformed by a rewrite", () => {
    const bad: string[] = [];
    for (const path of execFileSync("git", ["ls-files", "-z", "--", "src"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\0")) {
      if (!/\.(css|tsx|ts)$/.test(path)) continue;
      const text = readFileSync(path, "utf8");
      if (/--[a-z0-9-]+-var\(/.test(text)) bad.push(`${path}: nested var() inside a custom property name`);
    }
    expect(bad).toEqual([]);
  });
}, 60_000);
