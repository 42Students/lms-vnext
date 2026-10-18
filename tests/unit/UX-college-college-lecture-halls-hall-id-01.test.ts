import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx"),"utf8");
it("UX-college-college-lecture-halls-hall-id-01 keeps accessible shared screen state",()=>{
 expect(route).toContain("overflow-x-clip");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
