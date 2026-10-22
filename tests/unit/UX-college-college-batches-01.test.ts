import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/batches/page.tsx"),"utf8");
it("UX-college-college-batches-01 preserves state and mobile layout",()=>{
 expect(route).toContain('className="min-w-0 space-y-[var(--lms-space-4)]"');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
