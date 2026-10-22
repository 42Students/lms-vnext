import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/contacts/page.tsx"),"utf8");
it("UX-college-college-contacts-01 retains responsive forms, states and legacy copy",()=>{
 expect(route).toContain("min-w-0");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 expect(route).toContain("empty=");
});
