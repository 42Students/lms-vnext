import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/classes/page.tsx"),"utf8");
it("UX-college-college-classes-01 retains responsive forms, states and legacy copy",()=>{
 expect(route).toContain("overflow-x-clip");
 expect(route).toContain("CollegeStructureDirectory");
 expect(route).toContain("min-w-0");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
