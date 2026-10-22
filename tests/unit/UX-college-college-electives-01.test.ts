import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/electives/page.tsx"),"utf8");
it("UX-college-college-electives-01 preserves mobile UX and route policy",()=>{
 expect(route).toContain('className="min-w-0 space-y-4"');
 expect(route).toContain("CollegeStructureDirectory");
 expect(route).toContain("min-h-11");
 expect(route).not.toContain("text-on-primary");
 
});
