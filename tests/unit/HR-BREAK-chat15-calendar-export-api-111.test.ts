import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),calendar:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/recruiter-calendar-service",()=>({
 listRecruiterCalendarEvents:m.calendar,
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
import {GET} from "@/app/api/placements/recruiter/calendar/export/route";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE"}};
const path="https://lms.example/api/placements/recruiter/calendar/export";
describe("HR-CALENDAR-API-111 actual read-only exporter",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.calendar.mockResolvedValue({events:[],resultsDue:[]});
  m.error.mockImplementation(()=>Response.json({error:"INVALID_QUERY"},{status:400}));
 });
 it("invalid month, view or category never consults recruiter-owned calendar database",async()=>{
  for(const query of ["date=invalid&view=week","date=2099-01-01&view=other",
   "date=2099-01-01&view=week&category=PRIVATE"]){
   expect((await GET(new Request(path+"?"+query))).status).toBe(400);
  }
  expect(m.ctx).not.toHaveBeenCalled();expect(m.calendar).not.toHaveBeenCalled();
 });
 it("an authorized calendar CSV is private, read only and scoped through central service",async()=>{
  const response=await GET(new Request(path+"?date=2099-01-01&view=week&category=ROUNDS"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Export-Omitted")).toBe("0");
  expect(await response.text()).toContain("Date/time (IST)");
  expect(m.calendar).toHaveBeenCalledWith(actor,expect.objectContaining({
   from:expect.any(String),to:expect.any(String),
  }));
 });
 it("recruiter grant loss never publishes an unauthorized event CSV",async()=>{
  m.calendar.mockRejectedValue(new Error("recruiter grant revoked"));
  const response=await GET(new Request(path+"?date=2099-01-01&view=week"));
  expect(response.status).toBe(400);
  expect((await response.text())).not.toContain("recruiter grant revoked");
  expect(m.error).toHaveBeenCalledTimes(1);
 });
 it("multiple date keys are refused instead of choosing the first",async()=>{
  const response=await GET(new Request(path+"?date=2099-01-01&date=2099-02-01&view=week"));
  expect(response.status).toBe(400);
  expect(m.calendar).not.toHaveBeenCalled();
 });
});