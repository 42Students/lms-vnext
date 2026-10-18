import {beforeEach,describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {getPublicCollegeBranding} from "@/modules/colleges/branding-service";
import {getPublicPlacementStatistics} from "@/modules/placements/public-page/read-service";
import {getPublicPlacementPageContent} from "@/modules/placements/public-page/content-service";
import PublicPlacementsPage from "@/app/placements/page";

vi.mock("next/headers",()=>({headers:vi.fn()}));
vi.mock("next/navigation",()=>({notFound:vi.fn(()=>{throw new Error("NOT_FOUND");})}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/modules/colleges/branding-service",()=>({getPublicCollegeBranding:vi.fn()}));
vi.mock("@/modules/placements/public-page/read-service",()=>({getPublicPlacementStatistics:vi.fn()}));
vi.mock("@/modules/placements/public-page/content-service",()=>({getPublicPlacementPageContent:vi.fn()}));
vi.mock("@/components/placements/public-recruit-from-us",()=>({
 PublicRecruitFromUs:(props:{enabled:boolean;collegeName:string})=>
  createElement("section",{"data-recruit-enabled":String(props.enabled),
   "data-college":props.collegeName},"Recruit from us"),
}));

const collegeId="11111111-1111-4111-8111-111111111111";
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(headers).mockResolvedValue(new Headers({host:"college.example.edu"}) as Awaited<ReturnType<typeof headers>>);
 vi.mocked(resolveRequestTenant).mockResolvedValue({
  kind:"college",host:"college.example.edu",
  collegeId,organizationId:"22222222-2222-4222-8222-222222222222",
 });
 vi.mocked(getPublicCollegeBranding).mockResolvedValue({
  collegeName:"Example College",logoUrl:null,faviconUrl:null,loginBackgroundUrl:null,
  loginBackgroundUrlMobile:null,primaryColor:null,secondaryColor:null,
  supportEmail:null,supportPhone:null,termsUrl:null,privacyUrl:null,version:0,
 });
 vi.mocked(getPublicPlacementStatistics).mockResolvedValue(null);
 vi.mocked(getPublicPlacementPageContent).mockResolvedValue({
   ready:false,about:"",metricKeys:["STUDENTS","PLACED","OFFERS"],updatedAt:null,
  });
});

describe("chat-16 public placements page role and safe-unavailability journeys",()=>{
 it("UX-chat16-public-placement-16 denies unknown tenant domains before requesting college data",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"unknown",host:"unknown.example.edu"});
  await expect(PublicPlacementsPage()).rejects.toThrow("NOT_FOUND");
  expect(getPublicCollegeBranding).not.toHaveBeenCalled();
  expect(getPublicPlacementStatistics).not.toHaveBeenCalled();
 });
 it("UX-chat16-public-placement-17 does not render an explicitly unpublished college page",async()=>{
  await expect(PublicPlacementsPage()).rejects.toThrow("NOT_FOUND");
  expect(getPublicPlacementStatistics).toHaveBeenCalledWith(collegeId);
  expect(notFound).toHaveBeenCalledOnce();
 });
 it("UX-chat16-public-placement-18 treats a failed stats lookup as unavailable, not evidence of being unpublished",async()=>{
  vi.mocked(getPublicPlacementStatistics).mockRejectedValue(new Error("private-db-credentials"));
  const html=renderToStaticMarkup(await PublicPlacementsPage());
  expect(html).toContain("Public placement statistics are temporarily unavailable");
  expect(html).toContain("No individual student information is shown.");
  expect(html).not.toContain("private-db-credentials");
  expect(html).toContain('data-recruit-enabled="false"');
  expect(html).toContain("Example College");
 });
 it("UX-chat16-public-placement-19 never presents disabled public recruiting as active when no publication is verified",async()=>{
  vi.mocked(getPublicPlacementStatistics).mockRejectedValue(new Error("publication unverified"));
  const html=renderToStaticMarkup(await PublicPlacementsPage());
  expect(html).toContain('data-recruit-enabled="false"');
  expect(html).not.toContain("publication unverified");
  expect(html).toContain('aria-label="Placement results"');
 });
});