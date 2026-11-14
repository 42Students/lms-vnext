import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("environment matrix", () => {
  it("is up to date with the typed config (regenerate with: npx tsx scripts/gen-env-matrix.ts)", () => {
    const committed = readFileSync("docs/security/ENVIRONMENT-MATRIX.md", "utf8");
    // Regenerate to a string by running the script's logic through tsx, then compare. The script writes the file, so
    // compare before/after content and restore on mismatch.
    execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/gen-env-matrix.ts"], { stdio: "ignore" });
    const fresh = readFileSync("docs/security/ENVIRONMENT-MATRIX.md", "utf8");
    expect(fresh).toBe(committed);
  }, 60_000);
  it("names every harness switch as never-in-production", () => {
    const text = readFileSync("docs/security/ENVIRONMENT-MATRIX.md", "utf8");
    for (const name of ["E2E_AUTH_ENABLED", "E2E_SEED_ENABLED", "APP_E2E_SEED_ENABLED"]) {
      expect(text).toMatch(new RegExp("`" + name + "`[^\n]*NEVER be set in production"));
    }
  });
});
