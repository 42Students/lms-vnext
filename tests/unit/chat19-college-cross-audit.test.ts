import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseCollegeProjectsQuery } from "../../src/modules/projects/college-projects-query-model";

const read = (path: string) => readFileSync(path, "utf8");

describe("chat-19 college UX cross-audit", () => {
  it("COL-XA-08 accepts defaults and bounded, user-visible URL filters", () => {
    const defaults = parseCollegeProjectsQuery({});
    expect(defaults.success).toBe(true);
    if (defaults.success) {
      expect(defaults.data).toEqual({ view: "cards", page: 1, pageSize: 25 });
    }
    const filtered = parseCollegeProjectsQuery({
      q: [" Team  ", "ignored"], status: "ARCHIVED", view: "table",
      page: "3", pageSize: "50",
    });
    expect(filtered.success).toBe(true);
    if (filtered.success) {
      expect(filtered.data).toMatchObject({
        q: "Team", status: "ARCHIVED", view: "table", page: 3, pageSize: 50,
      });
    }
  });

  it.each([
    { page: "0" },
    { page: "-4" },
    { page: "Infinity" },
    { page: "NaN" },
    { page: "1.5" },
    { page: "999999999" },
    { pageSize: "20000" },
    { pageSize: "-1" },
    { status: "OTHER_COLLEGE" },
    { view: "javascript:alert(1)" },
    { q: "x".repeat(121) },
  ])("COL-XA-08 rejects malformed or hostile project list filters: %j", input => {
    expect(parseCollegeProjectsQuery(input).success).toBe(false);
  });

  it("COL-XA-08 returns recovery UI instead of rendering invalid pagination", () => {
    const page = read("src/app/(authenticated)/college/projects/page.tsx");
    expect(page).toContain("if (!parsed.success)");
    expect(page).toContain('title="Invalid project filters"');
    expect(page).toContain('href="/college/projects"');
    expect(page).not.toMatch(/page:\s*Number\(/);
  });

  it("COL-XA-09 keeps workspaces visible when optional template labels fail", () => {
    const page = read("src/app/(authenticated)/college/projects/page.tsx");
    expect(page).toContain("listProjectAdminSnapshots(context, membership.collegeId, query)");
    expect(page).toContain("listAssignedProjectTemplates(context, membership.collegeId)");
    expect(page).toMatch(/\.catch\(\(\) => \(\{ ok: false as const \}\)\)/);
    expect(page).toContain("Workspaces are still listed");
    expect(page).toContain("const templateTitles = new Map(");
    expect(page).not.toContain("templates.find(");
  });

  it("COL-XA-07 exposes roster fields and class-move controls in mobile cards", () => {
    const page = read("src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx");
    expect(page).toContain("<DataTable");
    expect(page).toContain('caption="Students in this batch"');
    expect(page).toContain('empty={<p className="text-sm text-muted-foreground">No matching students.</p>}');
    for (const column of ["Name", "Roll Number", "Email", "Current class", "Action"]) {
      expect(page).toContain(`header: "${column}"`);
    }
    expect(page).toContain('mobilePriority: "action"');
    expect(page).toContain("<StudentClassMoveAction");
    expect(page).not.toMatch(/<table[\\s>]/);
    const table = read("src/components/ui/data-table.tsx");
    expect(table).toContain('sm:hidden');
    expect(table).toContain('const visibleOnPhone');
    expect(table).toContain('<ScrollCue axis="x"');
  });
  it("COL-XA-10 rejects invalid cohort identifiers before querying the roster", () => {
    const page = read("src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx");
    expect(page).toContain("z.string().uuid().safeParse(rawId)");
    expect(page).toContain("if (!checkedId.success) notFound()");
    expect(page).toContain("eq(departments.collegeId, context.membership.collegeId)");
    expect(page).toContain("requirePermission(context");
  });

  it("COL-XA-11 uses mobile cards with labelled elective allocation checkboxes", () => {
    const page = read("src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx");
    expect(page).toContain("<DataTable");
    expect(page).toContain('caption="Eligible students for allocation"');
    expect(page).toContain('mobilePriority: "action"');
    expect(page).toContain('mobilePriority: "primary"');
    expect(page).toContain('mobilePriority: "secondary"');
    expect(page).toContain('name="membershipId"');
    expect(page).toContain('empty={<p');
    expect(page).not.toMatch(/<table[\\s>]/);
    expect(page).toContain('<ScrollCue axis="y"');
    expect(page).toContain('viewportClassName="max-h-80"');
    expect(page).toContain('aria-label={"Select "');
  });

  it("COL-XA-12 validates slot and offering before database mutation", () => {
    const page = read("src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx");
    expect(page).toContain("uuid.safeParse(slotId)");
    expect(page).toContain("if (!checkedSlot.success) notFound()");
    expect(page).toContain("uuid.safeParse(groupId)");
    expect(page).toContain("if (!checkedGroup.success) redirect(");
    expect(page).toContain("eq(electiveOfferings.groupId, checkedGroup.data)");
    expect(page).not.toMatch(/uuid\\.parse\\((slotId|groupId)\\)/);
  });

});
