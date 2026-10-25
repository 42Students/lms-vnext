import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {markRecruiterInviteNotHiring} from "@/modules/placements/tpo-recruiter-invite-service";
import {POST} from "@/app/api/public/recruiter-invite/[token]/not-hiring/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/tpo-recruiter-invite-service",()=>({
 markRecruiterInviteNotHiring:vi.fn(),
}));
const token="a".repeat(43);
const params={params:Promise.resolve({token})};
const req=(body:string)=>new Request("https://college.example.edu/api/public/recruiter-invite/"+token+"/not-hiring",{
 method:"POST",headers:{"Content-Type":"application/json"},body,
});
beforeEach(()=>{
 vi.clearAllMocks();vi.stubEnv("DB09_TPO_API_READY","DB09_VERIFIED");
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(markRecruiterInviteNotHiring).mockResolvedValue({status:"NOT_HIRING"});
});
afterEach(()=>vi.unstubAllEnvs());

describe("public recruiter decline note route",()=>{
 it("records only a validated note bound to the one-use invitation",async()=>{
  const response=await POST(req(JSON.stringify({note:"  Internship hiring paused  "})),params);
  expect(response.status).toBe(200);
  expect(markRecruiterInviteNotHiring).toHaveBeenCalledWith(
   token,expect.any(Date),"Internship hiring paused");
 });
 it("retains the existing no-note response for legacy callers",async()=>{
  expect((await POST(req("{}"),params)).status).toBe(200);
  expect(markRecruiterInviteNotHiring).toHaveBeenCalledWith(token);
 });
 it("rejects oversized or additional public fields before a write",async()=>{
  expect((await POST(req(JSON.stringify({note:"X".repeat(201)})),params)).status).toBe(400);
  expect((await POST(req(JSON.stringify({note:"",manualStage:"JOINED"})),params)).status).toBe(400);
  expect((await POST(req("X".repeat(2049)),params)).status).toBe(413);
  expect(markRecruiterInviteNotHiring).not.toHaveBeenCalled();
 });
 it("rejects cross-origin requests before reading body",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  expect((await POST(req("{}"),params)).status).toBe(403);
  expect(markRecruiterInviteNotHiring).not.toHaveBeenCalled();
 });
});
