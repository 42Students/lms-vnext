import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source=(name:string)=>readFileSync(join(process.cwd(),
  "src/components/admin",name+".tsx"),"utf8");

describe("UX-UNOWNED-TABLE-07/08 Super Admin import surfaces",()=>{
  it("student import history uses the shared mobile DataTable with intact four legacy headings",()=>{
    const text=source("super-admin-student-import-history");
    expect(text.startsWith('"use client";')).toBe(true);
    expect(text).toContain('import { DataTable } from "@/components/ui/data-table"');
    expect(text).toContain('caption="Bulk import history records"');
    expect(text).toContain('aria-label="Bulk import history"');
    expect(text).toContain("dialogRef.current?.showModal()");
    expect(text).toContain("dialogRef.current?.close()");
    for(const title of ["When","Students","Created","Failed"])
      expect(text).toContain('header:"'+title+'"');
    expect(text).toContain("No bulk imports on file for this college.");
    expect(text).not.toMatch(/<\s*table\b/i);
  });

  it("faculty CSV import preserves CAS confirmation, upload bounds and per-row outcomes",()=>{
    const text=source("super-admin-faculty-bulk-import");
    expect(text.startsWith('"use client";')).toBe(true);
    expect(text).toContain('import { DataTable } from "@/components/ui/data-table"');
    expect(text).toContain('useConfirmFlow');
    expect(text).toContain('await askConfirm("Onboard "+count+" faculty from this file?")');
    expect(text).toContain('{dialog}');
    expect(text).not.toContain("window.confirm(");
    expect(text).toContain('"/api/admin/faculty/bulk-import"');
    expect(text).toContain('confirmed:true');
    expect(text).toContain("1_500_000");
    expect(text).toContain('caption="Faculty bulk import results"');
    for(const title of ["Row","Name","Result","Reason"])
      expect(text).toContain('header:"'+title+'"');
    expect(text).toContain("CREATED");
    expect(text).toContain("FAILED");
    expect(text).toContain("SKIPPED");
    expect(text).toContain("min-h-11");
    expect(text).not.toMatch(/<\s*table\b/i);
  });
});
