import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx"),"utf8");
it("UX-college-college-groups-group-id-import-preview-01 keeps accessible shared screen state",()=>{
 const preview=readFileSync(join(process.cwd(),"src/components/groups/college-group-import-preview.tsx"),"utf8");
 expect(route).toContain("min-w-0 max-w-full");
 expect(preview).toContain('max-h-[35rem] min-w-0 overflow-auto');
 expect(preview).toContain('aria-label="Student group CSV validation report"');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
