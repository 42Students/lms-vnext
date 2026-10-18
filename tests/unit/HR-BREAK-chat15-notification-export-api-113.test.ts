import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),list:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/hr-notifications-service",()=>({
 listHrNotifications:m.list,
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
import {GET} from "@/app/api/placements/recruiter/notifications/export/route";
const college="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE"}};
const request=(suffix="")=>new Request("https://lms.example/api/placements/recruiter/notifications/export?collegeId="+college+suffix);
const notice=(n:number)=>({id:"notice-"+n,jobId:"own-job",title:"Engineering drive",
 label:"Drive published",unread:true,createdAt:new Date("2099-04-01T00:00:00Z")});
describe("HR-NOTIFICATIONS-API-113 employer CSV role and page changes",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.error.mockImplementation(()=>Response.json({error:"UNAVAILABLE"},{status:503}));
  m.list.mockResolvedValue({status:"READY",collegeId:college,rows:[notice(1)],
   unread:1,total:1,pages:1,page:1});
 });
 it("authorized scoped unread notifications are returned as no-store CSV, never chat bodies",async()=>{
  const response=await GET(request("&unreadOnly=true"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Export-Omitted")).toBe("0");
  const csv=await response.text();
  expect(csv).toContain("Drive published");
  expect(csv).not.toContain("private employer thread body");
  expect(m.list).toHaveBeenCalledWith(actor,expect.objectContaining({
   collegeId:college,unreadOnly:"true",page:1,
  }));
 });
 it("multi-college selection must be resolved before exporting any notices",async()=>{
  m.list.mockResolvedValue({status:"CHOOSE_COLLEGE",rows:[],total:0});
  expect((await GET(request())).status).toBe(403);
 });
 it("a grant revoked during export page two aborts instead of returning partial CSV",async()=>{
  m.list.mockResolvedValueOnce({status:"READY",collegeId:college,pages:2,total:26,
   unread:26,rows:Array.from({length:25},(_,i)=>notice(i))})
   .mockResolvedValueOnce({status:"NO_ACCESS",rows:[]});
  const response=await GET(request());
  expect(response.status).toBe(403);
  expect((await response.text())).not.toContain("Engineering drive");
 });
 it("hard 200-row limit reports accurately that the remaining notices were omitted",async()=>{
  m.list.mockImplementation(async(_ctx:unknown,query:{page:number})=>({
   status:"READY",collegeId:college,pages:9,total:202,unread:202,
   rows:Array.from({length:25},(_,i)=>notice((query.page-1)*25+i)),
  }));
  const response=await GET(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("X-Export-Omitted")).toBe("2");
  expect(m.list).toHaveBeenCalledTimes(8);
 });
 it("a private provider outage maps to safe JSON rather than spilling database messages",async()=>{
  m.list.mockRejectedValue(new Error("relation private.notifications timed out"));
  const response=await GET(request());
  expect(response.status).toBe(503);
  expect((await response.text())).not.toContain("private.notifications");
 });
});