import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (name: string) => readFileSync(new URL("../../src/modules/projects/" + name, import.meta.url), "utf8");
describe("PR-S2-12: consistent lifecycle authorization", () => {
  it("enforces the same account/tenant/module gate for lifecycle and mentor writes", () => {
    const access = read("access.ts");
    expect(access).toContain("export async function requireProjectLifecycleMutationAccess");
    expect(access).toContain("resolveOptionalModuleAccess(context)");
    for (const file of ["lifecycle-service.ts", "mentor-sprint-write-service.ts", "mentor-task-transition-service.ts"]) {
      expect(read(file)).toContain("requireProjectLifecycleMutationAccess(context,");
    }
  });
});
