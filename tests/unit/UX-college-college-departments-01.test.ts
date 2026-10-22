import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/departments/page.tsx"),"utf8");
it("UX-college-college-departments-01 verifies scoped responsive details",()=>{
 expect(route).toContain("grid min-w-0 grid-cols-1");
 const directory=readFileSync(join(process.cwd(),"src/components/admin/department-directory.tsx"),"utf8");
 expect(directory).toContain("overflow-x-auto");
 expect(directory).toContain('aria-label="Existing departments table"');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
