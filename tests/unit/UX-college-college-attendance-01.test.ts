import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/attendance/page.tsx"),"utf8");
it("UX-college-college-attendance-01 keeps responsive layout and legacy wording",()=>{
 expect(route).toContain('PageHeader title="Attendance"');
 expect(route).toContain("min-w-0");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
