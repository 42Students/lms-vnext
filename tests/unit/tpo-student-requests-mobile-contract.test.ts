import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("keeps request decisions and context available in compact mobile cards",()=>{
 const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/students/requests/page.tsx"),"utf8");
 expect(source).toContain('aria-label="Student requests mobile view"');
 expect(source).toContain("md:hidden");
 expect(source).toContain("md:block");
 expect(source).toContain("request.updatedAt.toISOString()");
 expect(source).toContain("Open placement job");
 expect(source).toContain("whitespace-pre-wrap break-words");
});
