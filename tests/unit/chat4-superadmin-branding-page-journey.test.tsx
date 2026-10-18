import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),preview:vi.fn(),branding:vi.fn(),detail:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-branding-preview-service",()=>({
 getSuperAdminCollegeBrandingPreview:mocks.preview,
}));
vi.mock("@/modules/colleges/branding-service",()=>({
 getCollegeBranding:mocks.branding,
}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
 getSuperAdminTenantLifecycleDetail:mocks.detail,
}));
vi.mock("@/components/admin/college-branding-preview",async()=>{
 const {createElement}=await import("react");
 return {CollegeBrandingPreview:()=>createElement("section",{"data-preview":"stored"},"Brand preview")};
});
vi.mock("@/components/admin/college-logo-uploader",async()=>{
 const {createElement}=await import("react");
 return {CollegeLogoUploader:(props:{collegeId:string;canEdit:boolean})=>
  createElement("section",{"data-upload":props.collegeId,
   "data-can-edit":String(props.canEdit)},"Logo upload")};
});
vi.mock("@/components/admin/college-branding-form",async()=>{
 const {createElement}=await import("react");
 return {CollegeBrandingForm:(props:{
  collegeId:string;canEdit:boolean;initialVersion:number;
 })=>createElement("section",{"data-form":props.collegeId,
  "data-version":String(props.initialVersion),
  "data-can-edit":String(props.canEdit)},"Edit branding")};
});
vi.mock("next/navigation",()=>({
 notFound:()=>{mocks.notFound();throw new Error("NEXT_NOT_FOUND");},
}));
import SuperAdminCollegeBrandingPage from "@/app/(authenticated)/admin/colleges/[collegeId]/branding/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor={
 user:{id:"sa",identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
const props=(id=collegeId)=>({params:Promise.resolve({collegeId:id})});
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.preview.mockResolvedValue({college:{id:collegeId,name:"IIT Dharwad"},brandingStored:true});
 mocks.branding.mockResolvedValue({
  collegeName:"IIT Dharwad",version:7,
  logoUrl:null,uploadedLogoUrl:null,faviconUrl:null,loginBackgroundUrl:null,
  loginBackgroundUrlMobile:null,primaryColor:null,secondaryColor:null,
  supportEmail:null,supportPhone:null,termsUrl:null,privacyUrl:null,
 });
 mocks.detail.mockResolvedValue({id:collegeId,organizationId:org,status:"ACTIVE"});
});

describe("SA-colleges-branding-page-01 tenant branding permissions and honest editor state",()=>{
 it("denies wrong-role actors before preview, logo, and stored branding reads",async()=>{
  mocks.context.mockResolvedValue({
   user:{...actor.user,systemRoles:[]},
   membership:{id:"member",collegeId,organizationId:org,status:"ACTIVE",roles:["LEARNER"]},
  });
  await expect(SuperAdminCollegeBrandingPage(props())).rejects.toBeDefined();
  expect(mocks.preview).not.toHaveBeenCalled();
  expect(mocks.branding).not.toHaveBeenCalled();
 });
 it("rejects malformed and foreign IDs without reading a different college's files",async()=>{
  await expect(SuperAdminCollegeBrandingPage(props("forged")))
   .rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.notFound).toHaveBeenCalledOnce();
  expect(mocks.preview).not.toHaveBeenCalled();
  expect(mocks.branding).not.toHaveBeenCalled();
 });
 it("rejects a missing or out-of-scope tenant preview",async()=>{
  mocks.preview.mockResolvedValueOnce(null);
  await expect(SuperAdminCollegeBrandingPage(props()))
   .rejects.toThrow("NEXT_NOT_FOUND");
  expect(mocks.branding).not.toHaveBeenCalled();
  expect(mocks.detail).not.toHaveBeenCalled();
 });
 it("renders persisted preview, real optimistic edit version and selected-college uploader",async()=>{
  const html=renderToStaticMarkup(await SuperAdminCollegeBrandingPage(props()));
  expect(html).toContain("Look and feel");
  expect(html).toContain("Actual login appearance");
  expect(html).toContain('data-preview="stored"');
  expect(html).toContain('data-upload="'+collegeId+'"');
  expect(html).toContain('data-form="'+collegeId+'"');
  expect(html).toContain('data-version="7"');
  expect(html).toContain('data-can-edit="true"');
  expect(html).toContain("Verify web address");
  expect(mocks.preview).toHaveBeenCalledWith(actor,collegeId);
  expect(mocks.branding).toHaveBeenCalledWith(actor,collegeId);
 });
 it("does not silently ignore a failed private branding read",async()=>{
  mocks.branding.mockRejectedValueOnce(new Error("BRANDING_UNAVAILABLE"));
  await expect(SuperAdminCollegeBrandingPage(props()))
   .rejects.toThrow("BRANDING_UNAVAILABLE");
 });
});
