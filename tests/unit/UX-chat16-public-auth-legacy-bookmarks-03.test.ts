// Page-level UX coverage (routes and physical source paths):
// /e2e/superadmin-login — src/app/e2e/superadmin-login/page.tsx
// /privacy-policy — src/app/privacy-policy/page.tsx
// /college-admin/departments — src/app/(authenticated)/college-admin/departments/page.tsx
// /college-admin/programs — src/app/(authenticated)/college-admin/programs/page.tsx
import {beforeEach,describe,expect,it,vi} from "vitest";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import type {RequestContext} from "@/modules/identity/context";
import E2EPage from "@/app/e2e/superadmin-login/page";
import LegacySuperAdminPage from "@/app/superadmin-login/page";
import PrivacyPage,{metadata as privacyMetadata} from "@/app/privacy-policy/page";
import DepartmentsPage from "@/app/(authenticated)/college-admin/departments/page";
import ProgramsPage from "@/app/(authenticated)/college-admin/programs/page";

vi.mock("next/navigation",()=>({
 redirect:vi.fn((target:string)=>{throw new Error("REDIRECT:"+target);}),
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:vi.fn(),
}));

const base:RequestContext={
 user:{id:"user-a",identityUid:"uid-a",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership-a",collegeId:"college-a",organizationId:"org-a",
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

beforeEach(()=>vi.clearAllMocks());

describe("chat-16 public/auth redirect pages handle expired sessions and wrong roles",()=>{
 it("UX-e2e-superadmin-login-01 never offers a privileged e2e bypass",()=>{
  expect(()=>E2EPage()).toThrow("REDIRECT:/login");
  expect(vi.mocked(redirect)).toHaveBeenCalledExactlyOnceWith("/login");
 });
 it("UX-superadmin-login-16 keeps legacy privileged bookmarks on the explicit first-party OTP path",()=>{
  expect(()=>LegacySuperAdminPage()).toThrow("REDIRECT:/login");
  expect(vi.mocked(redirect)).toHaveBeenCalledExactlyOnceWith("/login");
 });
 it("UX-privacy-policy-01 links the stable, existing static policy without an auth request",()=>{
  expect(privacyMetadata.title).toBe("Privacy | 42LMS");
  expect(()=>PrivacyPage()).toThrow("REDIRECT:/assets/static/privacy-policy-view.html");
  expect(vi.mocked(getCurrentRequestContext)).not.toHaveBeenCalled();
 });
 it("UX-college-admin-departments-01 keeps active admin bookmark role-scoped",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(base);
  await expect(DepartmentsPage()).rejects.toThrow("REDIRECT:/college/departments");
  expect(vi.mocked(getCurrentRequestContext)).toHaveBeenCalledTimes(1);
 });
 it("UX-college-admin-programs-01 keeps active admin bookmark role-scoped",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(base);
  await expect(ProgramsPage()).rejects.toThrow("REDIRECT:/college/programs");
  expect(vi.mocked(getCurrentRequestContext)).toHaveBeenCalledTimes(1);
 });
 it("UX-college-admin-departments-02 denies wrong role, disabled session and removed membership",async()=>{
  const invalid:RequestContext[]=[
   {...base,membership:{...base.membership!,roles:["LEARNER"]}},
   {...base,user:{...base.user,platformStatus:"DISABLED"}},
   {...base,membership:{...base.membership!,status:"SUSPENDED"}},
   {...base,membership:null},
  ];
  for(const ctx of invalid){
   vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx);
   await expect(DepartmentsPage()).rejects.toThrow("REDIRECT:/dashboard");
   await expect(ProgramsPage()).rejects.toThrow("REDIRECT:/dashboard");
  }
 });
 it("UX-college-admin-programs-02 cannot escalate a Super Admin system role to a college membership",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue({
   ...base,user:{...base.user,systemRoles:["SUPER_ADMIN"]},membership:null,
  });
  await expect(ProgramsPage()).rejects.toThrow("REDIRECT:/dashboard");
  await expect(DepartmentsPage()).rejects.toThrow("REDIRECT:/dashboard");
 });
});
