import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import {readFileSync} from "node:fs";

const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),reschedule:vi.fn(),error:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/placements/tpo-interview-reschedule-service",()=>({
 rescheduleTpoInterview:state.reschedule,
}));
import {POST} from "@/app/api/placements/tpo/interviews/[roundId]/reschedule/route";

const id="00000000-0000-4000-8000-000000000001";
const actor={user:{id:"tpo"},membership:{id:"membership",collegeId:"college-a"}};
const command={confirmed:true,expectedUpdatedAt:"2099-07-01T00:00:00.000Z",
 localDateTime:"2099-07-02T10:30",mode:"ON_CAMPUS",venue:"Main hall",
 reason:"Venue scheduling changed after recruiter confirmation"};
const params={params:Promise.resolve({roundId:id})};
const request=()=>new Request("https://college.example/api/placements/tpo/interviews/"+id+"/reschedule",{
 method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(command),
});
beforeEach(()=>{
 vi.clearAllMocks();vi.stubEnv("DB09_TPO_API_READY","DB09_VERIFIED");
 state.origin.mockReturnValue(true);state.context.mockResolvedValue(actor);
 state.reschedule.mockResolvedValue({id,scheduledAt:"2099-07-02T05:00:00.000Z"});
 state.error.mockImplementation(()=>NextResponse.json({
  message:"The round changed. Refresh the page and try again.",requestId:"req12345",
 },{status:409}));
});
afterEach(()=>vi.unstubAllEnvs());

describe("TPO-drive-workspace-44 guarded reschedule endpoint and error UX",()=>{
 it("TPO-drive-workspace-44 rejects forged origins before resolving the actor",async()=>{
  state.origin.mockReturnValue(false);
  const response=await POST(request(),params);
  expect(response.status).toBe(403);
  const body=await response.json();
  expect(body).toHaveProperty("message");
  expect(JSON.stringify(body)).not.toContain("INVALID_ORIGIN");
  expect(state.context).not.toHaveBeenCalled();
  expect(state.reschedule).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-44 reports unavailable migration with a friendly next step, not a raw code",async()=>{
  vi.stubEnv("DB09_TPO_API_READY","");
  const response=await POST(request(),params);
  expect(response.status).toBe(503);
  const body=await response.json();
  expect(body.message).toContain("temporarily unavailable");
  expect(JSON.stringify(body)).not.toContain("DB09_MIGRATIONS_PENDING");
  expect(state.context).not.toHaveBeenCalled();
  expect(state.reschedule).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-44 transmits explicit confirmation, expected version and secured actor to service",async()=>{
  const response=await POST(request(),params);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({id});
  expect(state.reschedule).toHaveBeenCalledWith(actor,id,command);
 });
 it("TPO-drive-workspace-44 maps stale or private service failures to a friendly retry without leaking internals",async()=>{
  state.reschedule.mockRejectedValueOnce(new Error("postgres internal admin password"));
  const response=await POST(request(),params);
  expect(response.status).toBe(409);
  expect(JSON.stringify(await response.json())).not.toMatch(/postgres|password|internal admin/);
  expect(state.error).toHaveBeenCalledTimes(1);
 });
 it("TPO-drive-workspace-44 keeps entered fields and uses ConfirmDialog, not a blocking native prompt or raw error code",()=>{
  const src=readFileSync("src/components/placements/tpo-interview-reschedule-form.tsx","utf8");
  expect(src).toContain("useRef<HTMLFormElement>");
  expect(src).toContain("ref={formRef}");
  expect(src).toContain("if(pending||!formRef.current)return");
  expect(src).toContain("<ConfirmDialog");
  expect(src).toContain("onConfirm={()=>{setConfirmOpen(false);void submitConfirmed();}}");
  expect(src).toContain("body?.message");
  expect(src).not.toContain("window.confirm(");
  expect(src).not.toContain("body?.error");
 });
});
