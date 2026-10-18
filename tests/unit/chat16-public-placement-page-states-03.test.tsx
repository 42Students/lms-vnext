import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {getPublicCollegeBranding} from "@/modules/colleges/branding-service";
import {getPublicPlacementStatistics} from "@/modules/placements/public-page/read-service";
import {getPublicPlacementPageContent} from "@/modules/placements/public-page/content-service";
import PublicPlacementsPage from "@/app/placements/page";

vi.mock("next/headers",()=>({headers:vi.fn()}));
vi.mock("next/navigation",()=>({
 notFound:vi.fn(()=>{throw new Error("NOT_FOUND");}),
}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/modules/colleges/branding-service",()=>({getPublicCollegeBranding:vi.fn()}));
vi.mock("@/modules/placements/public-page/read-service",()=>({getPublicPlacementStatistics:vi.fn()}));
vi.mock("@/modules/placements/public-page/content-service",()=>({getPublicPlacementPageContent:vi.fn()}));
vi.mock("@/components/placements/public-recruit-from-us",()=>({
 PublicRecruitFromUs:({enabled}:{enabled:boolean})=><div data-public-recruit-enabled={String(enabled)}/>,
}));

const college={
 collegeName:"Published College",logoUrl:null,faviconUrl:null,loginBackgroundUrl:null,
 loginBackgroundUrlMobile:null,primaryColor:null,secondaryColor:null,
 supportEmail:null,supportPhone:null,termsUrl:null,privacyUrl:null,version:0,
};
const metrics={
 publishedAt:"2099-01-01T00:00:00.000Z",population:30,placed:18,
 offers:21,employers:7,highestCtcInr:null,medianCtcInr:null,
};
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(headers).mockResolvedValue({
  get:(name:string)=>name==="host"?"placements.example.edu":null,
 } as Awaited<ReturnType<typeof headers>>);
 vi.mocked(resolveRequestTenant).mockResolvedValue({
  kind:"college",host:"placements.example.edu",collegeId:"college-id",organizationId:"org-id",
 });
 vi.mocked(getPublicCollegeBranding).mockResolvedValue(college);
 vi.mocked(getPublicPlacementStatistics).mockResolvedValue(metrics);
 vi.mocked(getPublicPlacementPageContent).mockResolvedValue({
  ready:true,about:"College placements overview",
  metricKeys:["PLACED","OFFERS","HIRING_COMPANIES"],updatedAt:null,
 });
});

describe("chat-16 public placement page privacy and partial availability",()=>{
 it("UX-chat16-public-placements-host-01 blocks unknown host before college or placement reads",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"unknown",host:"foreign.example.org"});
  await expect(PublicPlacementsPage()).rejects.toThrow("NOT_FOUND");
  expect(notFound).toHaveBeenCalledTimes(1);
  expect(getPublicPlacementStatistics).not.toHaveBeenCalled();
  expect(getPublicCollegeBranding).not.toHaveBeenCalled();
 });
 it("UX-chat16-public-placements-unpublished-02 never renders an unpublished college page",async()=>{
  vi.mocked(getPublicPlacementStatistics).mockResolvedValue(null);
  await expect(PublicPlacementsPage()).rejects.toThrow("NOT_FOUND");
  expect(notFound).toHaveBeenCalledTimes(1);
 });
 it("UX-chat16-public-placements-snapshot-03 renders public aggregate only and an explicit date",async()=>{
  const html=renderToStaticMarkup(await PublicPlacementsPage());
  expect(html).toContain("Published College");
  expect(html).toContain("College-published figures last updated");
  expect(html).toContain("Individual records are never displayed here.");
  expect(html).toContain("College placements overview");
  expect(html).toContain("Students placed");
  expect(html).toContain("Companies that hired");
  expect(html).toContain("sm:grid-cols-3");
  expect(html).toContain('data-public-recruit-enabled="false"');
  expect(html).not.toContain("private-student-email@example.org");
 });
 it("UX-chat16-public-placements-outage-04 distinguishes service outage from explicit unpublishing",async()=>{
  vi.mocked(getPublicPlacementStatistics).mockRejectedValue(new Error("private query failed"));
  const html=renderToStaticMarkup(await PublicPlacementsPage());
  expect(html).toContain("statistics are temporarily unavailable");
  expect(html).toContain("(not enough data yet)");
  expect(html).not.toContain("private query failed");
  expect(notFound).not.toHaveBeenCalled();
 });
 it("UX-chat16-public-placements-partial-05 protects the public page when content service fails",async()=>{
  vi.mocked(getPublicPlacementPageContent).mockRejectedValue(new Error("hidden content record"));
  const html=renderToStaticMarkup(await PublicPlacementsPage());
  expect(html).toContain("Students placed");
  expect(html).toContain("Offers");
  expect(html).toContain("Companies that hired");
  expect(html).not.toContain("hidden content record");
 });
 it("UX-chat16-public-placements-brand-06 does not misclassify temporary branding outage as 404",async()=>{
  vi.mocked(getPublicCollegeBranding).mockRejectedValue(new Error("private branding SQL"));
  const html=renderToStaticMarkup(await PublicPlacementsPage());
  expect(html).toContain("College placements");
  expect(html).toContain('role="status"');
  expect(html).not.toContain("private branding SQL");
  expect(notFound).not.toHaveBeenCalled();
 });
});
