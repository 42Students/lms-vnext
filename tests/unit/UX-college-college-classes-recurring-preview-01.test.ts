import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/classes/recurring-preview/page.tsx"),"utf8");
it("UX-college-college-classes-recurring-preview-01 retains responsive forms, states and legacy copy",()=>{
 expect(route).toContain('className="min-w-0 space-y-');
 expect(route).toContain("<CollegeRecurringRouteModal");
 expect(route).toContain("defaultSectionId:classId");
 const dialog=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/classes/recurring-preview/route-modal.tsx"),"utf8");
 expect(dialog).toContain('max-h-[70dvh]');
 expect(dialog).toContain("historyMode=\"route\"");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
