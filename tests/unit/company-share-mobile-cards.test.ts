import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("renders equivalent three-field mobile cards and desktop tables",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/company-share/[token]/page.tsx"),"utf8");
 expect(source).toContain('className="space-y-3 sm:hidden"');
 expect(source).toContain("sm:block");
 // The new TPO-selected share columns drive BOTH the mobile card and table;
 // neither surface may invent fields outside the server-approved row.cells.
 expect(source).toContain("row.applicationId");
 expect(source).toContain("columns.map(key=><div key={key}>");
 expect(source).toContain("columns.map(key=><td key={key}");
 expect(source).toContain("row.cells[key]");
 expect(source).toContain("COMPANY_SHARE_COLUMNS[key]");
 expect(source).not.toContain("row.phone");
 expect(source).not.toContain("row.resume");
});
