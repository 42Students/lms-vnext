import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lifecycle = readFileSync(new URL("../../src/modules/projects/lifecycle-service.ts", import.meta.url), "utf8");

describe("PR-S2-06: shipping requires a sprint", () => {
  it("rejects empty releases before checking open sprint status or updating status", () => {
    const ship = lifecycle.split("export async function shipProjectRelease(")[1] ?? "";
    expect(ship).toContain("if (!firstSprint)");
    expect(ship).toContain('eq(projectSprints.releaseId, release.id)');
    expect(ship.indexOf("if (!firstSprint)")).toBeLessThan(ship.indexOf("const [openSprint]"));
    expect(ship.indexOf("if (!firstSprint)")).toBeLessThan(ship.indexOf(".update(projectReleases)"));
  });
});
