import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/courses/page.tsx"),"utf8");
it("UX-college-college-courses-01 verifies scoped responsive details",()=>{
 expect(route).toContain('data-module="college-courses" className="min-w-0 max-w-full');
 expect(route).toContain("<CollegeCoursesLastGood");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
