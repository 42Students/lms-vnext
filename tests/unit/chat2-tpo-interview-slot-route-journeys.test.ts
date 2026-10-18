import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),read:vi.fn(),write:vi.fn(),error:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/placements/tpo-interview-slot-service",()=>({
 getTpoInterviewSlotWorkspace:state.read,mutateTpoInterviewSlots:state.write,
}));
import {
 GET,POST,
} from "@/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/interview-slots/route";

const jobId="00000000-0000-4000-8000-000000000001";
const roundId="00000000-0000-4000-8000-000000000002";
const params={params:Promise.resolve({jobId,roundId})};
const actor={user:{id:"staff"},membership:{id:"member",collegeId:"college-a"}};
const url="https://college.example/api/placements/tpo/jobs/"+jobId+"/rounds/"+roundId+"/interview-slots";
beforeEach(()=>{
 vi.clearAllMocks();
 state.origin.mockReturnValue(true);
 state.context.mockResolvedValue(actor);
 state.read.mockResolvedValue({storageReady:true,roster:[],slots:[]});
 state.write.mockResolvedValue({booked:1});
 state.error.mockImplementation(()=>NextResponse.json({
  message:"The interview request could not be completed. Refresh the page and retry.",
  requestId:"job12345",
 },{status:409}));
});

describe("TPO-drive-workspace-44 interview slot GET/POST route role, data and retry boundaries",()=>{
 it("TPO-drive-workspace-44 returns private no-store scoped interview roster without changing rows",async()=>{
  const result=await GET(new Request(url),params);
  expect(result.status).toBe(200);
  expect(result.headers.get("cache-control")).toContain("no-store");
  expect(await result.json()).toMatchObject({storageReady:true,slots:[]});
  expect(state.read).toHaveBeenCalledWith(actor,jobId,roundId);
  expect(state.write).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-44 denies forged origins before loading identity or booking slots",async()=>{
  state.origin.mockReturnValueOnce(false);
  const result=await POST(new Request(url,{method:"POST",body:JSON.stringify({
   action:"BOOK",confirmed:true,slotId:jobId,applicationId:roundId,expectedVersion:1,
  })}),params);
  expect(result.status).toBe(403);
  expect(state.context).not.toHaveBeenCalled();
  expect(state.write).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-44 passes untouched explicit version and action to scoped mutation service",async()=>{
  const command={action:"BOOK",confirmed:true,slotId:jobId,applicationId:roundId,expectedVersion:2};
  const result=await POST(new Request(url,{method:"POST",
   headers:{"Content-Type":"application/json"},body:JSON.stringify(command),
  }),params);
  expect(result.status).toBe(200);
  expect(result.headers.get("cache-control")).toContain("no-store");
  expect(await result.json()).toEqual({booked:1});
  expect(state.write).toHaveBeenCalledWith(actor,jobId,roundId,command);
 });
 it("TPO-drive-workspace-44 returns friendly error without leaking private DB exception details",async()=>{
  state.write.mockRejectedValueOnce(new Error("postgres private password @ internal-host"));
  const result=await POST(new Request(url,{method:"POST",
   headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"INVALID"}),
  }),params);
  expect(result.status).toBe(409);
  const body=JSON.stringify(await result.json());
  expect(body).not.toContain("private password");
  expect(body).not.toContain("internal-host");
  expect(state.error).toHaveBeenCalledTimes(1);
 });
 it("TPO-drive-workspace-44 does not fabricate empty roster when an authorized GET fails",async()=>{
  state.read.mockRejectedValueOnce(new Error("GET_SCOPE_DENIED"));
  const result=await GET(new Request(url),params);
  expect(result.status).toBe(409);
  const body=await result.json();
  expect(body).toHaveProperty("message");
  expect(body).not.toHaveProperty("roster");
  expect(state.error).toHaveBeenCalledTimes(1);
 });
});
