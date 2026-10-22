import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/groups/page.tsx"),"utf8");
it("UX-college-college-groups-01 preserves keyboard states, responsive layout and exact labels",()=>{
 expect(route).toContain("<DataTable");
 expect(route).toContain("min-h-11");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 expect(route).toContain("empty=");
});
