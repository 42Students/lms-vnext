import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without types
import { BASELINE_DIR, baselineNames, baselinePath, readBaseline } from "../../scripts/lib/baselines.mjs";

describe("baselines folder", () => {
  it("every baseline file parses as JSON and is reachable by name", () => {
    const names: string[] = baselineNames();
    expect(names.length).toBeGreaterThanOrEqual(7);
    for (const name of names) expect(typeof readBaseline(name)).toBe("object");
  });
  it("rejects names that could escape the folder", () => {
    expect(() => baselinePath("../secrets")).toThrow();
    expect(() => baselinePath("a/b")).toThrow();
    expect(baselinePath("centralisation")).toBe(`${BASELINE_DIR}/centralisation.json`);
  });
  it("no script or workflow builds a baseline path by hand", () => {
    const hits = execSync("git ls-files scripts .github", { encoding: "utf8" })
      .split("\n")
      .filter((f) => /\.(mjs|cjs|ts|yml|yaml)$/.test(f) && f !== "scripts/lib/baselines.mjs")
      .filter((f) => /docs\/security\/baselines\/[a-z-]+\.json/.test(readFileSync(f, "utf8")))
      // workflows may name the CI matrix baseline through MATRIX_BASELINE; comments may cite the path
      .filter((f) => !f.startsWith(".github/"))
      .filter((f) => readFileSync(f, "utf8").split("\n").some((l) => /docs\/security\/baselines\//.test(l) && !/^\s*(\/\/|\*|#)/.test(l)));
    expect(hits).toEqual([]);
  });
});
