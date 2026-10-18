import {beforeEach,describe,expect,it,vi} from "vitest";
import {archiveProjectInstanceInputSchema,projectArchiveTokenMatches} from "@/modules/projects/instance-archive-model";

const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),archive:vi.fn(),error:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/projects/instance-service",()=>({archiveProjectInstance:mocks.archive}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.error}));
import {POST} from "@/app/api/projects/[projectId]/archive/route";

const projectId="11111111-1111-4111-8111-111111111111";
const context={user:{id:"college-admin"}};
const params={params:Promise.resolve({projectId})};
const url="https://lms.example.test/api/projects/"+projectId+"/archive";
const request=(body:unknown,headers:Record<string,string>={})=>
 new Request(url,{method:"POST",headers:{"Content-Type":"application/json",...headers},
  body:typeof body==="string"?body:JSON.stringify(body)});

beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue(context);
 mocks.archive.mockResolvedValue({id:projectId,status:"ARCHIVED"});
 mocks.error.mockReturnValue(new Response("Safe rejection",{status:409}));
});

describe("PROJ-BREAK-COLLEGE-04-ARCHIVE-07 optimistic College Admin archive",()=>{
 it("passes the visible project's timestamp and scoped actor to the archive service",async()=>{
  const expectedUpdatedAt="2099-10-18T04:30:00.000Z";
  const response=await POST(request({expectedUpdatedAt}),params);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({project:{id:projectId,status:"ARCHIVED"}});
  expect(mocks.archive).toHaveBeenCalledOnce();
  expect(mocks.archive).toHaveBeenCalledWith(context,projectId,{expectedUpdatedAt});
 });
 it("blocks cross-origin POST before resolving a session or writing to a project",async()=>{
  mocks.origin.mockReturnValue(false);
  const response=await POST(request({expectedUpdatedAt:"2099-10-18T04:30:00.000Z"}),params);
  expect(response.status).toBe(403);
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.archive).not.toHaveBeenCalled();
 });
 it.each(["","not-json",JSON.stringify({})])("rejects invalid JSON shape %s without entering mutation",async body=>{
  const response=await POST(request(body),params);
  expect(response.status).toBe(400);
  expect(mocks.archive).not.toHaveBeenCalled();
 });
 it("refuses oversized request bodies and Content-Length before any archive side effect",async()=>{
  const body=JSON.stringify({expectedUpdatedAt:"2".repeat(900)});
  const result=await POST(request(body),params);
  expect(result.status).toBe(400);
  expect(mocks.archive).not.toHaveBeenCalled();
 });
 it("does not expose provider exception details when the service rejects a stale project",async()=>{
  mocks.archive.mockRejectedValueOnce(new Error("private SQL details"));
  const result=await POST(request({expectedUpdatedAt:"2099-10-18T04:30:00.000Z"}),params);
  expect(result.status).toBe(409);
  expect(await result.text()).toBe("Safe rejection");
 });
 it("validates precise timestamps and forbids injected tenant or status fields",()=>{
  expect(archiveProjectInstanceInputSchema.safeParse({
   expectedUpdatedAt:"2099-10-18T04:30:00.000Z",
  }).success).toBe(true);
  for(const raw of [
   {expectedUpdatedAt:"yesterday"},
   {expectedUpdatedAt:"2099-10-18"},
   {expectedUpdatedAt:"2099-10-18T04:30:00.000Z",collegeId:"forged"},
   {expectedUpdatedAt:"2099-10-18T04:30:00.000Z",status:"ARCHIVED"},
  ])expect(archiveProjectInstanceInputSchema.safeParse(raw).success).toBe(false);
 });
 it("compares canonical millisecond timestamps, never accepting an older tab",()=>{
  const stored=new Date("2099-10-18T04:30:00.123Z");
  expect(projectArchiveTokenMatches(stored,"2099-10-18T04:30:00.123Z")).toBe(true);
  expect(projectArchiveTokenMatches(stored,"2099-10-18T04:29:59.000Z")).toBe(false);
  expect(projectArchiveTokenMatches(stored,"bad-date")).toBe(false);
 });
});
