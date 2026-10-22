import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const specs:[string,boolean,boolean][]=[["src/components/academics/academics-section-page.tsx",true,true],["src/components/academics/academics-overview.tsx",false,true],["src/components/announcements/super-admin-college-broadcast-form.tsx",false,false],["src/components/courses/admin-assessment-read-directory.tsx",true,true],["src/components/academics/college-cohort-management.tsx",true,true],["src/components/academics/college-section-management.tsx",true,true],["src/components/admin/college-create-form.tsx",true,false],["src/components/admin/college-branding-preview.tsx",true,true],["src/components/verification/SuperAdminVerificationPanel.tsx",true,false],["src/components/admin/super-admin-faculty-assignment-create.tsx",true,true],["src/components/admin/admin-scoped-read-page.tsx",false,true]] as const;
describe("UX-admin first third delegated touch and contrast audits",()=>{
 for(const [path,touch,ink] of specs)it(path,()=>{
  const s=readFileSync(path,"utf8");
  // Phone controls must be 44px; 36px desktop overrides remain valid.
  if(touch){
   const controlSource=path==="src/components/academics/academics-section-page.tsx"
    ?readFileSync("src/components/ui/page-back-link.tsx","utf8"):s;
   if(controlSource!==s)expect(s).toContain("<PageBackLink");
   expect(controlSource).toContain("min-h-11");
   expect(controlSource).not.toMatch(/(?:^|[\s"'])min-h-(?:8|9|10)\b/);
  }
  if(ink)expect(s).not.toContain("text-[#26bac7]");
 });
});
