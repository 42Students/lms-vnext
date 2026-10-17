import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("SA-tenants-modules-22 mounts existing authorized branding editor for Super Admin",()=>{
 const page=readFileSync(new URL("../../src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx",import.meta.url),"utf8");
 expect(page).toContain("getCollegeBranding(context,collegeId)");
 expect(page).toContain("organizationId:tenant.organizationId");
 expect(page).toContain('can(context,"college.manage"');
 expect(page).toContain("<CollegeBrandingForm");
 expect(page).toContain("<CollegeLogoUploader");
});
