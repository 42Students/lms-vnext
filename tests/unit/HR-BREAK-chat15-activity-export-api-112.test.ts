import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),list:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/hr-job-activity-service",()=>({
 listRecruiterJobActivity:m.list,
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
import {GET} from "@/app/api/placements/recruiter/activity/export/route";
const college="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"employer",platformStatus:"ACTIVE"}};
const request=()=>new Request("https://lms.example/api/placements/recruiter/activity/export?collegeId="+college);
const event=(n:number)=>({id:"evt-"+n,jobId:"job-owned",title:"Engineer",
 status:"Published",occurredAt:new Date("2099-01-01T00:00:00Z")});
describe("HR-ACTIVITY-API-112 employer-scoped 200-row event export",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.error.mockImplementation(()=>Response.json({error:"UNAVAILABLE"},{status:503}));
  m.list.mockResolvedValue({status:"READY",collegeId:college,
   events:[event(1)],hasNext:false,page:1});
 });
 it("GET uses a scoped read-only service and a no-store CSV",async()=>{
  const response=await GET(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Export-Capped")).toBe("false");
  expect(await response.text()).toContain("Engineer");
  expect(m.list).toHaveBeenCalledWith(actor,expect.objectContaining({
   collegeId:college,limit:100,page:1,
  }));
 });
 it("a no-access state never emits a private event CSV",async()=>{
  m.list.mockResolvedValue({status:"CHOOSE_COLLEGE",events:[]});
  const response=await GET(request());
  expect(response.status).toBe(403);
  expect(response.headers.get("Content-Type")??"").not.toContain("text/csv");
 });
 it("a grant revoked between page reads aborts the entire export",async()=>{
  m.list.mockResolvedValueOnce({status:"READY",collegeId:college,
   events:Array.from({length:100},(_,i)=>event(i)),hasNext:true})
   .mockResolvedValueOnce({status:"NO_ACCESS",events:[]});
  const response=await GET(request());
  expect(response.status).toBe(403);
  expect((await response.text())).not.toContain("Engineer");
 });
 it("more than 200 authorized events are capped and the export says so",async()=>{
  m.list.mockResolvedValueOnce({status:"READY",collegeId:college,
   events:Array.from({length:100},(_,i)=>event(i)),hasNext:true})
   .mockResolvedValueOnce({status:"READY",collegeId:college,
   events:Array.from({length:100},(_,i)=>event(i+100)),hasNext:true});
  const response=await GET(request());
  expect(response.headers.get("X-Export-Capped")).toBe("true");
  expect(await response.text()).toContain("Additional authorized events omitted");
  expect(m.list).toHaveBeenCalledTimes(2);
 });
 it("unexpected SQL failures return a sanitized unavailable result",async()=>{
  m.list.mockRejectedValue(new Error("relation private_schema.events broken"));
  const response=await GET(request());
  expect(response.status).toBe(503);
  expect((await response.text())).not.toContain("private_schema");
 });
});