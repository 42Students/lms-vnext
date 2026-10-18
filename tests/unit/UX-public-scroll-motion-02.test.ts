import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");
const publicPages=[
 "src/app/company-share/[token]/page.tsx","src/app/e2e/superadmin-login/page.tsx",
 "src/app/enterprises/page.tsx","src/app/forbidden/page.tsx",
 "src/app/platform/page.tsx","src/app/privacy-policy/page.tsx",
 "src/app/request-demo/page.tsx","src/app/universities/page.tsx",
 "src/app/(authenticated)/college-admin/departments/page.tsx",
 "src/app/(authenticated)/college-admin/programs/page.tsx",
];
describe("UX-public-scroll-motion-02",()=>{
 it("does not create invisible, unlabelled ad hoc scrollers or long bespoke animations",()=>{
  for(const path of publicPages){
   const source=read(path);
   expect(source,path).not.toMatch(/overflow-[xy]-auto|overflow-auto|overflow-scroll/);
   expect(source,path).not.toMatch(/duration-(?:[3-9]\d\d|\d{4,})/);
   expect(source,path).not.toMatch(/transition-(?:all|none)\b/);
  }
 });
 it("shared applicant results inherit the accessible horizontal scroll cue",()=>{
  const table=read("src/components/ui/data-table.tsx");
  const cue=read("src/components/ui/scroll-cue.tsx");
  const share=read("src/app/company-share/[token]/page.tsx");
  expect(share).toContain("<DataTable");
  expect(table).toContain('<ScrollCue axis="x"');
  expect(table).toContain("scrollable columns");
  expect(cue).toContain("overscroll-x-contain");
 });
});
