import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collegePromotionQuerySchema, formatPromotionAcademicYear } from "@/modules/academics/college-batch-promotion-model";
import { filterDepartmentRows, pageDepartmentRows } from "@/modules/admin-ui/department-directory";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("chat-11 college academic setup remaining acceptance", () => {
  it("COL-academic-setup-17 provides named create/update/graduate success feedback", () => {
    const code = source("src/components/academics/college-cohort-management.tsx");
    expect(code).toContain("Created batch “${parsed.data.name}”. Next, create its classes/sections.");
    expect(code).toContain("Updated batch “${parsed.data.name}”.");
    expect(code).toContain("Marked “${row.name}” as graduated (Completed).");
  });
  it("COL-academic-setup-20 prompts with the changed department name before discarding", () => {
    const code = source("src/components/admin/department-actions.tsx");
    expect(code).toContain("nextName.trim() !== name");
    expect(code).toContain("setDiscardOpen(true)");
    expect(code).toContain("Discard department changes?");
    expect(code).toContain("Your edits to “${name}” will be lost.");
  });
  it("COL-academic-setup-21 sorts, paginates, counts and clears department searches", () => {
    const rows = ["Zoology", "Physics", "Biology"].map((name, index) => ({
      id: String(index), name, createdAt: "2099-01-01", usage: null,
    }));
    const sorted = filterDepartmentRows(rows, "");
    expect(sorted.map(r => r.name)).toEqual(["Biology", "Physics", "Zoology"]);
    expect(pageDepartmentRows(sorted, 2, 2).items.map(r => r.name)).toEqual(["Zoology"]);
    const code = source("src/components/admin/department-directory.tsx");
    expect(code).toContain("[10, 25, 50, 100]");
    expect(code).toContain("Clear search");
    expect(code).toContain("Sort Department Name");
    expect(code).toContain("{result.total} of {rows.length}");
  });
  it("COL-academic-setup-36 accepts consecutive YYYY-YY overrides and rejects invalid years", () => {
    expect(formatPromotionAcademicYear(2099)).toBe("2099-00");
    expect(collegePromotionQuerySchema.parse({yearStart:"2099-00"}).yearStart).toBe(2099);
    expect(collegePromotionQuerySchema.parse({yearStart:"2100-01"}).yearStart).toBe(2100);
    expect(collegePromotionQuerySchema.safeParse({yearStart:"2099-01"}).success).toBe(false);
    expect(collegePromotionQuerySchema.safeParse({yearStart:"2099-99"}).success).toBe(false);
    expect(source("src/app/(authenticated)/college/batch-promotion/page.tsx")).toContain("formatPromotionAcademicYear(parsed.data.yearStart)");
  });
  it("COL-academic-setup-40 provides department retry and safe loading feedback", () => {
    const error = source("src/app/(authenticated)/college/departments/error.tsx");
    const loading = source("src/app/(authenticated)/college/departments/loading.tsx");
    expect(error).toContain("Could not load departments");
    expect(error).toContain("onClick={reset}");
    expect(error).not.toContain("{error.message}");
    expect(loading).toContain("Loading departments…");
    expect(loading).toContain('aria-busy="true"');
  });
});
