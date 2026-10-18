import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

const mocks=vi.hoisted(()=>({context:vi.fn(),detail:vi.fn(),notFound:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
 getSuperAdminTenantLifecycleDetail:mocks.detail,
}));
vi.mock("@/components/admin/tenant-restore-action",async()=>{
 const {createElement}=await import("react");
 return {TenantRestoreAction:(props:{kind:string;id:string})=>
  createElement("button",{"data-kind":props.kind,"data-tenant-id":props.id},"Restore")};
});
vi.mock("next/navigation",()=>({
 notFound:()=>{mocks.notFound();throw new Error("NEXT_NOT_FOUND");},
}));
import TenantDetail from "@/app/(authenticated)/admin/colleges/[collegeId]/page";
import {CollegeServiceError} from "@/modules/colleges/service";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
const details={
 id:collegeId,name:"IIT Dharwad",code:"iit-dharwad",
 organizationId:org,organizationName:"Partner organization",
 status:"ACTIVE",organizationStatus:"ACTIVE",
 city:"Dharwad",state:"Karnataka",country:"India",
 createdAt:new Date("2099-10-18T00:00:00Z"),
};
const props={params:Promise.resolve({collegeId})};
beforeEach(()=>{
 mocks.context.mockReset();mocks.detail.mockReset();mocks.notFound.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.detail.mockResolvedValue(details);
});
describe("SA-colleges-detail-01 tenant detail status and privacy",()=>{
 it("renders the selected active tenant with concrete setup links but no restore action",async()=>{
  const html=renderToStaticMarkup(await TenantDetail(props));
  for(const label of ["IIT Dharwad","Partner organization","College code",
    "Readiness","Branding","Admins","Sign-in Methods","Web address","Tenant directory",
    "Set up this college"]){
   expect(html).toContain(label);
  }
  expect(html).not.toContain('data-kind="college"');
  expect(mocks.detail).toHaveBeenCalledWith(actor,collegeId);
 });
 it("an archived college may be restored only with an active parent and cannot open setup links",async()=>{
  mocks.detail.mockResolvedValue({...details,status:"ARCHIVED"});
  const html=renderToStaticMarkup(await TenantDetail(props));
  expect(html).toContain("Restore archived college");
  expect(html).toContain('data-kind="college"');
  expect(html).not.toContain("Set up this college");
  expect(html).not.toContain(">Branding</a>");
  expect(html).not.toContain(">Sign-in Methods</a>");
 });
 it("when the parent is archived, the page explains the required restore order without an unsafe action",async()=>{
  mocks.detail.mockResolvedValue({
   ...details,status:"ARCHIVED",organizationStatus:"ARCHIVED",
  });
  const html=renderToStaticMarkup(await TenantDetail(props));
  expect(html).toContain("Restore the parent organization before restoring this college");
  expect(html).not.toContain('data-kind="college"');
 });
 it("does not render foreign, missing or invalid selected college data",async()=>{
  mocks.detail.mockRejectedValueOnce(new CollegeServiceError("COLLEGE_NOT_FOUND"));
  await expect(TenantDetail(props)).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.notFound).toHaveBeenCalledOnce();
 });
 it("propagates revoked Super Admin errors without emitting a partial tenant detail",async()=>{
  mocks.detail.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(TenantDetail(props)).rejects.toThrow("REVOKED");
 });
});
