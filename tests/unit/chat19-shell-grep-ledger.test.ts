import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = () => readFileSync("scripts/audit/chat19-shell-grep.cjs", "utf8");

/** Regression contract for the read-only B3/B4 full-checkout command ledger.
 * Its Git subprocesses are not executed by these source-only assertions. */
describe("chat-19 B3/B4 complete-tree grep ledger", () => {
  it("runs only Git read commands, in the checkout root, and records its exact HEAD", () => {
    const text = source();
    expect(text).toContain('const root = resolve(__dirname, "../..")');
    expect(text).toContain('const { execFileSync } = require("node:child_process")');
    expect(text).toContain('return execFileSync("git", args, {');
    expect(text).toContain('execFileSync("git", ["rev-parse", "HEAD"]');
    expect(text).toContain('"grep", "-n", "-I", "-E"');
    expect(text).not.toContain("npm run");
    expect(text).not.toContain("git checkout");
    expect(text).not.toContain("git add");
    expect(text).not.toContain("git push");
  });
  it("distinguishes grep zero matches from Git failures", () => {
    expect(source()).toContain("if (error.status === 1) return [];");
    expect(source()).toContain("throw error;");
    expect(source()).toContain("Unexpected git grep -n output");
  });
  it("checks every tracked .ts .tsx .css file rather than indexed search excerpts", () => {
    const text = source();
    expect(text).toContain('["tsx", "ts", "css"]');
    expect(text).toContain(':(glob)${path}/**/*.${ext}');
    for (const name of ["sidebar-class-coverage", "shell-and-tpo-overlay-coverage",
      "route-progress-coverage", "raw-control-coverage",
      "shell-hardcoded-visuals", "duplicate-sidebar-and-mobile-footer"]) {
      expect(text).toContain(name);
    }
    expect(text).toContain("nonlegacy-top-strip-regressions");
    expect(text).toContain("lms-route-progress-segment");
    expect(text).toContain('role="progressbar"');
    expect(text).toContain('paths: ["src"]');
    expect(text).toContain('paths: ["src/components/shell", "src/components/tpo"]');
  });
  it("reports file and line counts and every path:line match for owner proof", () => {
    const text = source();
    for (const shape of ["lineCount: matches.length", "fileCount: paths.length",
      "shellLineCount:", "tpoLineCount:", "matches: matches.map"]) {
      expect(text).toContain(shape);
    }
    expect(text).toContain('if (option === "--json")');
    expect(text).toContain('...row.commands');
    expect(text).toContain('...(row.matches.length ? row.matches : ["(zero)"])');
  });
});
