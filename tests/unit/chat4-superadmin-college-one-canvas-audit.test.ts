import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = "src/app/(authenticated)/admin/";
const read = (path: string) => readFileSync(join(process.cwd(), root, path), "utf8");

describe("Super Admin colleges/organizations canvas and page states", () => {
  it("UX-COL-ONE-CANVAS-01 directories have one page surface and unboxed search controls", () => {
    const colleges = read("colleges/page.tsx");
    const organizations = read("organizations/page.tsx");
    for (const page of [colleges, organizations]) {
      expect(page).toContain('className="min-w-0 space-y-6"');
      expect(page).toContain('flex flex-wrap items-end gap-3 border-t border-border pt-4');
      expect(page).not.toContain("flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4");
      expect(page).toContain("<DataTable");
      expect(page).toContain("<Pagination");
      expect(page).toContain("min-h-11");
      expect(page).toContain("<ErrorState");
      expect(page.indexOf("requirePermission(context")).toBeLessThan(
        page.indexOf("parseAdminDirectorySearchParams(await searchParams)"),
      );
    }
    expect(colleges).toContain("No colleges match your search");
    expect(colleges).toContain("No active colleges in this scope");
    expect(organizations).toContain("No organizations in this scope");
    expect(organizations).toContain("No archived organizations in this scope.");
    expect(organizations).toContain('details className="border-t border-border pt-4"');
  });

  it("UX-COL-ONE-CANVAS-02 tenant detail preserves archived states and scope-safe setup links on the same canvas", () => {
    const detail = read("colleges/[collegeId]/page.tsx");
    expect(detail).toContain('className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2"');
    expect(detail).toContain("tenantSetupLinksAvailable(item.status,item.organizationStatus)");
    expect(detail).toContain("Restore the parent organization before restoring this college.");
    expect(detail).toContain("Setup links are unavailable while this college or its organization is archived.");
    expect(detail).toContain("getSuperAdminTenantLifecycleDetail(context,collegeId)");
    expect(detail).toContain("notFound()");
    expect(detail).not.toContain('grid gap-4 rounded-xl border border-border bg-surface p-5');
  });

  it("UX-COL-ONE-CANVAS-03 administrator directory keeps its role actions and empties without a nested card", () => {
    const admins = read("colleges/[collegeId]/admins/page.tsx");
    expect(admins).toContain('aria-label="College administrator directory" className="border-t border-border pt-4"');
    expect(admins).not.toContain('aria-label="College administrator directory" className="rounded-xl');
    expect(admins).toContain("No active College Admin or TPO accounts in this college.");
    expect(admins).toContain("Showing the first 500 role records.");
    expect(admins).toContain("CollegeAdminLifecycleAction");
    expect(admins).toContain("View active devices");
    expect(admins).toContain("View history");
    expect(admins).toContain('mobilePriority:"primary"');
  });

  it("UX-COL-ONE-CANVAS-04 readiness separates major sections with dividers, never hiding unknown evidence", () => {
    const readiness = read("colleges/[collegeId]/readiness/page.tsx");
    expect(readiness).toContain('aria-label="Must fix before launch" className="min-w-0 space-y-3 border-t border-border pt-5"');
    expect(readiness).toContain('aria-label="Recommended setup" className="border-t border-border pt-5"');
    expect(readiness).toContain("className=\"border-t border-border pt-5\"");
    expect(readiness).not.toContain('className="rounded-xl border border-border bg-surface p-5"');
    expect(readiness).toContain("Unknown source");
    expect(readiness).toContain("UNKNOWN means the underlying");
    expect(readiness).toContain("A missing source never counts as ready.");
    expect(readiness).toContain("No readiness checks match the selected status and area.");
    expect(readiness).toContain('className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"');
  });
});
