import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {hasActiveMembership,hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {legacyDepartmentDestination,legacyProgramDestination} from "@/modules/admin-ui/legacy-department-links";

vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:vi.fn(),hasMembershipRole:vi.fn(),isSuperAdmin:vi.fn(),
}));
const context={} as RequestContext;
const read=(file:string)=>readFileSync(file,"utf8");

describe("UX-college-admin-departments-02 role-safe legacy redirect",()=>{
 beforeEach(()=>{
  vi.mocked(hasActiveMembership).mockReturnValue(false);
  vi.mocked(hasMembershipRole).mockReturnValue(false);
  vi.mocked(isSuperAdmin).mockReturnValue(false);
 });
 it("UX-college-admin-departments-02 requires active college admin membership",()=>{
  expect(legacyDepartmentDestination(context,"COLLEGE_ADMIN")).toBe("/dashboard");
  vi.mocked(hasActiveMembership).mockReturnValue(true);
  expect(legacyDepartmentDestination(context,"COLLEGE_ADMIN")).toBe("/dashboard");
  vi.mocked(hasMembershipRole).mockReturnValue(true);
  expect(legacyDepartmentDestination(context,"COLLEGE_ADMIN")).toBe("/college/departments");
 });
 it("UX-college-admin-programs-02 applies the same checks to programs",()=>{
  expect(legacyProgramDestination(context,"COLLEGE_ADMIN")).toBe("/dashboard");
  vi.mocked(hasActiveMembership).mockReturnValue(true);
  vi.mocked(hasMembershipRole).mockReturnValue(true);
  expect(legacyProgramDestination(context,"COLLEGE_ADMIN")).toBe("/college/programs");
 });
 it("UX-college-admin-departments-02 and UX-college-admin-programs-02 never use user-provided redirect URLs",()=>{
  for(const [file,resolver] of [
   ["src/app/(authenticated)/college-admin/departments/page.tsx","legacyDepartmentDestination"],
   ["src/app/(authenticated)/college-admin/programs/page.tsx","legacyProgramDestination"],
  ]){
   const code=read(file);
   expect(code).toContain("getCurrentRequestContext");
   expect(code).toContain(resolver+"(context, \"COLLEGE_ADMIN\")");
   expect(code).toContain("redirect(");
   expect(code).not.toContain("searchParams");
  }
 });
});
