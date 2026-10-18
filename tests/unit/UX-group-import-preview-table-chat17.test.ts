import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("UX-UNOWNED-TABLE-09 college group bulk import preview",()=>{
  it("retains validation statuses, row/email fields and safe download after migrating to mobile table",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/components/groups/college-group-import-preview.tsx"),"utf8");
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain('import { DataTable } from "@/components/ui/data-table"');
    expect(source).toContain('<DataTable<Result["rows"][number]>');
    expect(source).toContain('caption="Group import preview validation"');
    for(const title of ["Row","Email","Validation"])
      expect(source).toContain('header:"'+title+'"');
    expect(source).toContain('row.status.replaceAll("_"," ")');
    expect(source).toContain("break-all");
    expect(source).toContain("No learner rows were supplied.");
    expect(source).toContain("Download safe error CSV");
    expect(source).toContain("131072");
    expect(source).toContain("Preview only. No memberships");
    expect(source).not.toMatch(/<\s*table\b/i);
    expect(source).not.toMatch(/<\s*(thead|tbody|tr|td)\b/i);
  });
});
