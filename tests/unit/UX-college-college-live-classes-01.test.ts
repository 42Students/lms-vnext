import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/live-classes/page.tsx"),"utf8");
it("UX-college-college-live-classes-01 ensures route-safe responsive navigation",()=>{
 expect(route).toContain("min-w-0");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
});
