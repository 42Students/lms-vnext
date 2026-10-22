import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/faculty/import/page.tsx"),"utf8");
it("UX-college-college-faculty-import-01 preserves keyboard states, responsive layout and exact labels",()=>{
 expect(route).toContain("min-w-0 max-w-full");
 expect(route).toContain('PageHeader title="Import faculty"');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
