import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const specs=[["src/components/academics/academics-section-page.tsx",true,true],["src/components/academics/academics-overview.tsx",false,true],["src/components/announcements/super-admin-college-broadcast-form.tsx",false,false],["src/components/courses/admin-assessment-read-directory.tsx",true,true],["src/components/academics/college-cohort-management.tsx",true,true],["src/components/academics/college-section-management.tsx",true,true],["src/components/admin/college-create-form.tsx",true,false],["src/components/admin/college-branding-preview.tsx",true,true],["src/components/verification/SuperAdminVerificationPanel.tsx",true,false],["src/components/admin/super-admin-faculty-assignment-create.tsx",true,true],["src/components/admin/admin-scoped-read-page.tsx",false,true]] as const;
describe("UX-admin first third delegated touch and contrast audits",()=>{
 for(const [path,touch,ink] of specs)it(path,()=>{
  const s=readFileSync(path,"utf8");
  if(touch)expect(s).not.toMatch(/min-h-(?:8|9|10)\b/);
  if(ink)expect(s).not.toContain("text-primary-text");
 });
});
