import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** These five paths were still listed as raw tables in the older generated
 * UX matrix. Assert their current migration instead of changing the scanner
 * snapshot by hand; CI should regenerate docs/audit/ux/COVERAGE-MATRIX.md.
 */
const migrated = [
  "class-team-workspace-creator",
  "mentor-task-allocation",
  "project-admin-submissions-page",
  "project-admin-workspace-list",
  "super-admin-template-subview-page",
] as const;

describe("UX-projects-raw-table-44 Project screens use the shared responsive table", () => {
  it.each(migrated)("%s never regresses to inaccessible raw table markup", (file) => {
    const source = readFileSync(
      join(process.cwd(),"src/components/projects",file+".tsx"),"utf8",
    );
    expect(source).toMatch(/import\s+\{\s*DataTable\s*\}\s+from\s+["']@\/components\/ui\/data-table["']/);
    expect(source).toContain("<DataTable");
    expect(source).not.toMatch(/<\s*table\b/i);
    expect(source).not.toMatch(/<\s*(thead|tbody|tr|td)\b/i);
  });
});
