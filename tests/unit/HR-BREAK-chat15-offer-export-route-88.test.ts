import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),read:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/hr-job-read-service",()=>({getHrJobRead:m.read}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
import {GET} from "@/app/api/placements/recruiter/jobs/[jobId]/offers/export/route";
const job="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE"}};
const view=(offerState:string)=>GET(new Request(
 "https://lms.example/api/placements/recruiter/jobs/"+job+"/offers/export?offerState="+offerState),{
 params:Promise.resolve({jobId:job}),
});
describe("HR-OFFER-EXPORT-88: issuer rows are not draft selection ledger entries",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.read.mockResolvedValue({offersPage:{total:1,pages:1,pageSize:15},
   offers:[{id:"offer-1",name:"Applicant",role:"Engineer",status:"ISSUED",
    annualCtcInr:900000,joiningDate:null,issuedAt:new Date("2099-01-01T00:00:00Z"),
    expiresAt:null,joiningStatus:null}]});
 });
 it.each(["SELECTED","PENDING_VERIFICATION","REVOKED"])(
  "%s refuses a misleading issued-offer export without querying private candidate data",
  async state=>{
   const response=await view(state);
   expect(response.status).toBe(400);
   expect(await response.json()).toMatchObject({error:"OFFER_STATE_NOT_EXPORTABLE"});
   expect(m.ctx).not.toHaveBeenCalled();
   expect(m.read).not.toHaveBeenCalled();
  });
 it("a real ISSUED filter emits a private no-store employer CSV with masked contact",async()=>{
  const response=await view("ISSUED");
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Export-Omitted")).toBe("0");
  const csv=await response.text();
  expect(csv).toContain("Masked");
  expect(csv).toContain("Applicant");
  expect(m.read).toHaveBeenCalledWith(actor,job,expect.objectContaining({
   tab:"offers",offerState:"ISSUED",offerPage:1,
  }));
 });
 it("malformed offer states are rejected before any privileged job read",async()=>{
  const response=await view("UNKNOWN_STATUS");
  expect(response.status).toBe(400);
  expect(m.read).not.toHaveBeenCalled();
 });
});