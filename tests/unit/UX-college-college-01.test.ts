import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/page.tsx"),"utf8");
it("UX-college-college-01 preserves legacy copy and responsive UX contracts",()=>{
 expect(route).toContain('className="min-w-0 max-w-full');
 expect(route).toContain('aria-label="College greeting"');
 expect(route).toContain("min-h-11");
 expect(route).not.toContain("text-on-primary");
 
});
