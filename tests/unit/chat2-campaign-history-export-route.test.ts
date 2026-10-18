import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({getContext:vi.fn(),exportHistory:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.getContext}));
vi.mock("@/modules/messaging/receipt-history-service",()=>({exportTpoMessagingHistory:mocks.exportHistory}));
import {GET} from "@/app/api/placements/tpo/campaigns/history/export/route";

const url=(query:string)=>new Request("https://college.example.test/api/placements/tpo/campaigns/history/export?"+query);
describe("TPO-campaigns-public-12 private campaign history CSV request contract",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.getContext.mockResolvedValue({user:{id:"tpo-a"},membership:{collegeId:"own-college"}});
  mocks.exportHistory.mockResolvedValue([]);
 });
 it("rejects repeated purpose filters before reaching private delivery rows",async()=>{
  const response=await GET(url("purpose=Draft&purpose=Private"));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({error:"INVALID_QUERY"});
  expect(mocks.exportHistory).not.toHaveBeenCalled();
 });
 it("does not accept smuggled college or unauthorized custom selectors",async()=>{
  for(const query of [
   "purpose=Hiring&collegeId=foreign","other=value",
   "purpose=Hiring&purpose=Hiring","purpose=Hiring&other=a&other=b",
  ]){
   const response=await GET(url(query));
   expect(response.status).toBe(400);
  }
  expect(mocks.exportHistory).not.toHaveBeenCalled();
 });
 it("bounds purpose length and retains exact user-selected filter for a private scoped read",async()=>{
  expect((await GET(url("purpose="+"x".repeat(161)))).status).toBe(400);
  expect(mocks.exportHistory).not.toHaveBeenCalled();
  const response=await GET(url("purpose=Campus+campaign"));
  expect(response.status).toBe(200);
  expect(mocks.exportHistory).toHaveBeenCalledWith(
   expect.objectContaining({user:{id:"tpo-a"}}),{purpose:"Campus campaign"},
  );
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Content-Type")).toContain("text/csv");
 });
 it("handles export row cap as a recoverable error without leaking any batch",async()=>{
  mocks.exportHistory.mockRejectedValue(new Error("CAMPAIGN_EXPORT_TOO_LARGE"));
  const response=await GET(url("purpose=Broad"));
  expect(response.status).toBe(413);
  const body=await response.json();
  expect(body).toMatchObject({error:"EXPORT_TOO_LARGE"});
  expect(body.message).toContain("Narrow the purpose filter");
 });
});
