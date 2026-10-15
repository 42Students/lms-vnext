import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("renders equivalent three-field mobile cards and desktop tables",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/company-share/[token]/page.tsx"),"utf8");
 expect(source).toContain('className="space-y-3 sm:hidden"');
 expect(source).toContain("sm:block");
 expect(source).toContain("row.applicationId");
 expect(source).toContain("row.displayName");
 expect(source).toContain("row.email");
 expect(source).not.toContain("row.phone");
 expect(source).not.toContain("row.resume");
});
