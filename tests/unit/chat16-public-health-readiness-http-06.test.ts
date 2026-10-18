import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET as healthGet} from "@/app/health/route";
import {GET as readyGet} from "@/app/ready/route";
import {getHealthPayload} from "@/modules/system/health";
import {getReadinessResultWithRuntime} from "@/modules/system/readiness-runtime";

vi.mock("@/modules/system/health",()=>({getHealthPayload:vi.fn()}));
vi.mock("@/modules/system/readiness-runtime",()=>({getReadinessResultWithRuntime:vi.fn()}));
const timestamp="2099-01-01T00:00:00.000Z";
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(getHealthPayload).mockReturnValue({status:"ok",service:"lms-vnext",timestamp});
 vi.mocked(getReadinessResultWithRuntime).mockResolvedValue({
  httpStatus:200,payload:{
   status:"ready",service:"lms-vnext",timestamp,dependencies:{database:"ok"},
  },
 });
});

describe("chat-16 public health and readiness HTTP boundaries",()=>{
 it("UX-chat16-public-health-route-01 returns public liveness without database or account details",async()=>{
  const response=healthGet();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({status:"ok",service:"lms-vnext",timestamp});
  expect(getReadinessResultWithRuntime).not.toHaveBeenCalled();
 });
 it("UX-chat16-public-ready-route-02 returns only aggregate readiness when database works",async()=>{
  const response=await readyGet();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
   status:"ready",service:"lms-vnext",timestamp,dependencies:{database:"ok"},
  });
  expect(getReadinessResultWithRuntime).toHaveBeenCalledTimes(1);
 });
 it("UX-chat16-public-ready-outage-03 sends 503 and no private driver or connection diagnostics",async()=>{
  vi.mocked(getReadinessResultWithRuntime).mockResolvedValue({
   httpStatus:503,payload:{
    status:"not_ready",service:"lms-vnext",timestamp,dependencies:{database:"unavailable"},
   },
  });
  const response=await readyGet();
  expect(response.status).toBe(503);
  const body=await response.text();
  expect(body).toContain('"database":"unavailable"');
  for(const privateValue of ["DATABASE_URL","postgresql://","password","stack trace"]){
   expect(body).not.toContain(privateValue);
  }
 });
});
