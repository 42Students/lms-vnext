import {beforeEach,describe,expect,it,vi} from "vitest";
import {getReadinessResultWithRuntime} from "@/modules/system/readiness-runtime";
import {getHealthPayload} from "@/modules/system/health";
import {GET as readyGET} from "@/app/ready/route";
import {GET as healthGET} from "@/app/health/route";

vi.mock("@/modules/system/readiness-runtime",()=>({getReadinessResultWithRuntime:vi.fn()}));
vi.mock("@/modules/system/health",()=>({getHealthPayload:vi.fn()}));
const timestamp="2026-10-18T00:00:00.000Z";
beforeEach(()=>vi.clearAllMocks());

describe("chat-16 public health and readiness route truthfulness",()=>{
 it("UX-chat16-public-ready-16 never presents an unavailable database as ready",async()=>{
  vi.mocked(getReadinessResultWithRuntime).mockResolvedValue({
   httpStatus:503,payload:{status:"not_ready",service:"lms-vnext",timestamp,
    dependencies:{database:"unavailable"}},
  });
  const response=await readyGET();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
   status:"not_ready",service:"lms-vnext",timestamp,dependencies:{database:"unavailable"},
  });
 });
 it("UX-chat16-public-ready-17 responds 200 only when the runtime reports ready",async()=>{
  vi.mocked(getReadinessResultWithRuntime).mockResolvedValue({
   httpStatus:200,payload:{status:"ready",service:"lms-vnext",timestamp,
    dependencies:{database:"ok"}},
  });
  const response=await readyGET();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({status:"ready",dependencies:{database:"ok"}});
 });
 it("UX-chat16-public-health-18 stays a basic liveness probe, not a private debug endpoint",async()=>{
  vi.mocked(getHealthPayload).mockReturnValue({status:"ok",service:"lms-vnext",timestamp});
  const response=healthGET();
  expect(response.status).toBe(200);
  const body=await response.json() as Record<string,unknown>;
  expect(body).toEqual({status:"ok",service:"lms-vnext",timestamp});
  expect(JSON.stringify(body)).not.toContain("DATABASE_URL");
  expect(JSON.stringify(body)).not.toContain("provider-token");
  expect(getReadinessResultWithRuntime).not.toHaveBeenCalled();
 });
});