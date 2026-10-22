import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/domains/page.tsx"),"utf8");
it("UX-college-college-domains-01 preserves mobile UX and route policy",()=>{
 expect(route).toContain("overflow-x-clip");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
