import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";

const fixture=vi.hoisted(()=>({
 context:vi.fn(),active:vi.fn(),read:vi.fn(),grant:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fixture.context}));
vi.mock("@/modules/identity/context",()=>({hasActiveRecruiter:fixture.active}));
vi.mock("@/modules/placements/hr-job-read-service",()=>({getHrJobRead:fixture.read}));
vi.mock("@/modules/placements/recruiter-applicant-resume-service",()=>({
 grantRecruiterSharedResume:fixture.grant,
}));
import {GET} from "@/app/api/placements/recruiter/jobs/[jobId]/applicants/resumes/export/route";

const jobId="123e4567-e89b-42d3-a456-426614174001";
const applicationId="123e4567-e89b-42d3-a456-426614174002";
const route="https://lms.example/api/placements/recruiter/jobs/"+jobId+"/applicants/resumes/export";
const params={params:Promise.resolve({jobId})};
const recruiter={user:{id:"recruiter"},recruiter:{userId:"recruiter"}};
const applicant=(id=applicationId)=>({id,status:"SUBMITTED",resumeShared:true});
const page=(rows:ReturnType<typeof applicant>[],pages=1)=>({
 applicants:{rows},applicantsPage:{pages},
});
function mockSignedFile(){
 const fetcher=vi.fn(async()=>new Response(new Uint8Array([37,80,68,70,45,49]),{
  status:200,headers:{"content-length":"6","content-type":"application/pdf"},
 }));
 vi.stubGlobal("fetch",fetcher);
 fixture.grant.mockResolvedValue({
  url:"https://storage.example/private-file?signature=ephemeral",
  contentType:"application/pdf",
 });
 return fetcher;
}
describe("chat-16 recruiter drive bulk resumes ZIP",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  fixture.context.mockResolvedValue(recruiter);
  fixture.active.mockReturnValue(true);
  fixture.read.mockResolvedValue(page([applicant()]));
  mockSignedFile();
 });
 afterEach(()=>{vi.unstubAllGlobals();});
 it("rejects additional query parameters before fetching private actor or records",async()=>{
  const response=await GET(new Request(route+"?url=https://attacker.test"),params);
  expect(response.status).toBe(400);
  expect(fixture.context).not.toHaveBeenCalled();
  expect(fixture.read).not.toHaveBeenCalled();
 });
 it("rejects expired or swapped employer principal without a private read",async()=>{
  fixture.active.mockReturnValue(false);
  const revoked=await GET(new Request(route),params);
  expect(revoked.status).toBe(404);
  expect(fixture.read).not.toHaveBeenCalled();
  fixture.active.mockReturnValue(true);
  fixture.context.mockResolvedValue({...recruiter,recruiter:{userId:"different"}});
  const swapped=await GET(new Request(route),params);
  expect(swapped.status).toBe(404);
  expect(fixture.grant).not.toHaveBeenCalled();
 });
 it("re-authorizes the exact shortlisted application and downloads a bounded ZIP",async()=>{
  const response=await GET(new Request(route),params);
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("Content-Type")).toBe("application/zip");
  expect(response.headers.get("Content-Disposition")).toContain(".zip");
  expect(fixture.read).toHaveBeenCalledWith(recruiter,jobId,expect.objectContaining({
   tab:"applicants",stage:"ALL",page:1,
  }));
  expect(fixture.grant).toHaveBeenCalledWith(recruiter,jobId,applicationId);
  const bytes=new Uint8Array(await response.arrayBuffer());
  expect([...bytes.slice(0,4)]).toEqual([80,75,3,4]);
  const archiveText=new TextDecoder().decode(bytes);
  expect(archiveText).toContain("applicant-"+applicationId+".pdf");
  expect(archiveText).toContain("manifest.txt");
  expect(archiveText).toContain("Only currently consented and CLEAN-verified resumes");
  expect(archiveText).not.toContain("signature=ephemeral");
 });
 it("never treats missing grants or unreadable objects as downloadable files",async()=>{
  fixture.grant.mockRejectedValue(new Error("private storage keys and evidence"));
  const response=await GET(new Request(route),params);
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({error:"RESUMES_NOT_AVAILABLE"});
  expect(fixture.grant).toHaveBeenCalledWith(recruiter,jobId,applicationId);
 });
 it("rejects oversized objects and caps candidate attempts at twenty",async()=>{
  const fetcher=vi.fn(async()=>new Response(new Uint8Array([0]),{
   headers:{"content-length":String(6*1024*1024)},
  }));
  vi.stubGlobal("fetch",fetcher);
  fixture.read.mockResolvedValue(page(Array.from({length:25},(_,i)=>applicant(
   "123e4567-e89b-42d3-a456-"+String(i).padStart(12,"0"),
  ))));
  const response=await GET(new Request(route),params);
  expect(response.status).toBe(409);
  expect(fixture.grant).toHaveBeenCalledTimes(20);
  expect(fetcher).toHaveBeenCalledTimes(20);
 });
});
