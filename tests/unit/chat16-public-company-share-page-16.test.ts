import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {cookies} from "next/headers";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import CompanySharePage,{metadata} from "@/app/company-share/[token]/page";

vi.mock("next/headers",()=>({cookies:vi.fn()}));
vi.mock("@/modules/placements/company-share/public-service",()=>({
 getPublicCompanyApplicantShare:vi.fn(),
}));
const token="opaque-public-company-share-test-token";
const request=(search:Record<string,string>={})=>({
 params:Promise.resolve({token}),searchParams:Promise.resolve(search),
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(cookies).mockResolvedValue({get:()=>undefined} as Awaited<ReturnType<typeof cookies>>);
 vi.mocked(getPublicCompanyApplicantShare).mockResolvedValue({kind:"CODE_REQUIRED"});
});

describe("chat-16 public company-share page private applicant and access states",()=>{
 it("UX-chat16-company-share-16 requires a separate six-digit access proof before rendering applicants",async()=>{
  const html=renderToStaticMarkup(await CompanySharePage(request()));
  expect(metadata.robots).toEqual({index:false,follow:false});
  expect(html).toContain("Enter the 6-digit share code");
  expect(html).toContain('method="post"');
  expect(html).toContain('pattern="[0-9]{6}"');
  expect(html).not.toContain("Shared applicants</caption>");
  expect(getPublicCompanyApplicantShare).toHaveBeenCalledWith(
   token,1,"VIEW","",null,
  );
 });
 it("UX-chat16-company-share-17 denies an expired or withdrawn link without rendering a code form",async()=>{
  vi.mocked(getPublicCompanyApplicantShare).mockResolvedValue({kind:"UNAVAILABLE"});
  const html=renderToStaticMarkup(await CompanySharePage(request()));
  expect(html).toContain("This link is not valid any more.");
  expect(html).toContain('role="alert"');
  expect(html).not.toContain('method="post"');
  expect(html).not.toContain("shortlisted applicants");
 });
 it("UX-chat16-company-share-18 keeps temporary provider errors private and provides a retry",async()=>{
  vi.mocked(getPublicCompanyApplicantShare).mockRejectedValue(new Error("private database credentials"));
  const html=renderToStaticMarkup(await CompanySharePage(request()));
  expect(html).toContain("This page is temporarily unavailable. Try again.");
  expect(html).toContain("Try again");
  expect(html).not.toContain("private database credentials");
  expect(html).not.toContain("Enter the 6-digit share code");
 });
 it("UX-chat16-company-share-19 honors selected columns and does not leak unselected contact details",async()=>{
  vi.mocked(getPublicCompanyApplicantShare).mockResolvedValue({
   kind:"READY",title:"Graduate Engineer",companyName:"Acme",
   collegeName:"Example College",sharedAt:"2026-10-01T00:00:00.000Z",
   expiresAt:"2027-10-01T00:00:00.000Z",
   rows:[{applicationId:"application-1",displayName:"Ada Student",
    email:"private-student@example.org",cells:{NAME:"Ada Student"}}],
   selectedColumns:["NAME"],shortlistBy:null,total:1,page:1,totalPages:1,
   truncated:false,search:"",
  });
  const html=renderToStaticMarkup(await CompanySharePage(request({q:"Ada"})));
  expect(html).toContain("Ada Student");
  expect(html).toContain("Shared with Acme");
  expect(html).toContain("Everything you open is logged");
  expect(html).not.toContain("private-student@example.org");
  expect(html).not.toContain("Student mobile");
  expect(html).toContain("Shared applicants");
 });
});