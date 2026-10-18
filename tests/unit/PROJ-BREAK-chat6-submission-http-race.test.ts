import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateProjectSubmissionDraft,submitProjectSubmission} from "@/modules/projects/submission-service";
import {PATCH} from "@/app/api/projects/[projectId]/submissions/[submissionId]/route";
import {POST} from "@/app/api/projects/[projectId]/submissions/[submissionId]/submit/route";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:vi.fn()}));
vi.mock("@/modules/projects/submission-service",()=>({
  updateProjectSubmissionDraft:vi.fn(),submitProjectSubmission:vi.fn(),
}));
const projectId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const revised="2026-10-18T12:34:56.789Z";
const params={params:Promise.resolve({projectId,submissionId})};
const context={user:{id:"33333333-3333-4333-8333-333333333333"},membership:{id:"44444444-4444-4444-8444-444444444444"}};
const request=(kind:"PATCH"|"POST",body?:unknown)=>new Request(
  "https://iit-dharwad.example/api/projects/"+projectId+"/submissions/"+submissionId+
  (kind==="POST"?"/submit":""),
  {method:kind,headers:{"Content-Type":"application/json"},body:body===undefined?"{invalid":JSON.stringify(body)},
);
beforeEach(()=>{
  vi.resetAllMocks();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
  // The real API error contract includes customer-safe copy and a request reference.
  vi.mocked(apiErrorResponse).mockImplementation(()=>NextResponse.json(
    {error:"PROJECT_SUBMISSION_CONFLICT",message:"This draft changed. Refresh and try again.",requestId:"test-ref"},{status:409}));
  vi.mocked(updateProjectSubmissionDraft).mockResolvedValue({id:submissionId,updatedAt:new Date(revised)} as never);
  vi.mocked(submitProjectSubmission).mockResolvedValue({id:submissionId,status:"SUBMITTED"} as never);
});

describe("PROJ-BREAK-submissions-10/11 authenticating shared draft writes at HTTP boundary",()=>{
  it("a foreign-origin PATCH is rejected before reading user context or mutating shared drafts",async()=>{
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    const response=await PATCH(request("PATCH",{summary:"forged",expectedUpdatedAt:revised}),params);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
    expect(getCurrentRequestContext).not.toHaveBeenCalled();
    expect(updateProjectSubmissionDraft).not.toHaveBeenCalled();
  });
  it("a foreign-origin submit cannot finalize or notify",async()=>{
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    const response=await POST(request("POST",{expectedUpdatedAt:revised}),params);
    expect(response.status).toBe(403);
    expect(submitProjectSubmission).not.toHaveBeenCalled();
  });
  it("PATCH forwards tenant-bound path and the exact browser revision to protected service",async()=>{
    const body={summary:"IIT final report",attachments:[],expectedUpdatedAt:revised};
    const response=await PATCH(request("PATCH",body),params);
    expect(response.status).toBe(200);
    expect(updateProjectSubmissionDraft).toHaveBeenCalledOnce();
    expect(updateProjectSubmissionDraft).toHaveBeenCalledWith(context,projectId,submissionId,body);
    const json=await response.json();
    expect(json.submission.updatedAt).toBe(revised);
  });
  it("POST passes revision to the locked service, rather than dropping JSON and submitting a stale row",async()=>{
    const body={expectedUpdatedAt:revised};
    const response=await POST(request("POST",body),params);
    expect(response.status).toBe(200);
    expect(submitProjectSubmission).toHaveBeenCalledOnce();
    expect(submitProjectSubmission).toHaveBeenCalledWith(context,projectId,submissionId,body);
  });
  it("malformed JSON fails safely and cannot invoke project transitions",async()=>{
    const response=await POST(request("POST"),params);
    expect(response.status).toBe(409);
    expect(apiErrorResponse).toHaveBeenCalledOnce();
    expect(submitProjectSubmission).not.toHaveBeenCalled();
  });
  it("service conflict is returned through centralized safe error mapping",async()=>{
    vi.mocked(updateProjectSubmissionDraft).mockRejectedValueOnce(new Error("sensitive PG sql"));
    const response=await PATCH(request("PATCH",{summary:"newer",expectedUpdatedAt:revised}),params);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({error:"PROJECT_SUBMISSION_CONFLICT",message:"This draft changed. Refresh and try again.",requestId:"test-ref"});
    expect(apiErrorResponse).toHaveBeenCalledOnce();
  });
});
