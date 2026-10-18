import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { academicScopePageHref } from "@/components/admin/academic-module-scope-inventory";

describe("UX-UNOWNED-TABLE-02 academic module-access hierarchy",()=>{
  it("preserves tenant filters and replaces academicPage without losing search/hash",()=>{
    expect(academicScopePageHref("/admin/module-access?collegeId=abc&academicPage=2#hierarchy",3))
      .toBe("/admin/module-access?collegeId=abc&academicPage=3#hierarchy");
    expect(academicScopePageHref("/admin/module-access",1))
      .toBe("/admin/module-access?academicPage=1");
    expect(academicScopePageHref("/admin/module-access?academicPage=not-valid&view=people",2))
      .toBe("/admin/module-access?academicPage=2&view=people");
  });

  it("does not create links to hostile or invalid pages",()=>{
    for(const href of ["https://evil.example.test","//evil.example.test","/%2fevil.example.test",
      "javascript:alert(1)"," /admin/module-access"]){
      expect(academicScopePageHref(href,2)).toBeNull();
    }
    for(const n of [0,-1,Infinity,NaN,1.5,Number.MAX_SAFE_INTEGER+1])
      expect(academicScopePageHref("/admin/module-access",n)).toBeNull();
  });

  it("renders module rules and effective states in shared responsive table",()=>{
    const source=readFileSync(join(process.cwd(),
      "src/components/admin/academic-module-scope-inventory.tsx"),"utf8");
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain('import { DataTable, type DataTableColumn }');
    expect(source).toContain("DataTableColumn<AcademicModuleScope>");
    expect(source).toContain('caption="Academic hierarchy and effective module rules"');
    for(const text of ["Level","Academic path","Projects","Placements",
      "Electives","Students in scope","Effective:","Expand all","Collapse all"])
      expect(source).toContain(text);
    expect(source).toContain("scopes.slice(0,15)");
    expect(source).toContain("min-h-11");
    expect(source).not.toMatch(/<\s*table\b/i);
    expect(source).not.toMatch(/<\s*(thead|tbody|tr|td)\b/i);
  });
});
