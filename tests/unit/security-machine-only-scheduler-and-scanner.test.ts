import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {POST as scheduledNotification} from
 "@/app/api/internal/operations/notification-scheduler/route";
import {POST as scannerVerdict} from
 "@/app/api/internal/storage/scan-verdict/route";
import {executeScheduledJobWithLease} from "@/modules/operations/scheduled-job-runner";
import {applyProductionScanVerdict,productionScannerCallbackReady} from
 "@/modules/storage/production-scan-verdict-service";

vi.mock("@/modules/operations/postgres-scheduled-job-lease-store",()=>({
 postgresScheduledJobLeaseStore:{},
}));
vi.mock("@/modules/operations/scheduled-job-runner",()=>({
 executeScheduledJobWithLease:vi.fn(async()=>({ran:false,reason:"LOCKED"})),
 LEGACY_NOTIFICATION_JOB_SCHEDULES:{
  release:{ttlMs:60000},cleanup:{ttlMs:60000},
  interviewReminder:{ttlMs:60000},assignmentReminder:{ttlMs:60000},
 },
 scheduledJobWorkerIdentity:vi.fn(()=>({holderId:"test"})),
}));
vi.mock("@/modules/operations/notification-scheduled-job-service",()=>({
 cleanupScheduledInAppNotifications:vi.fn(),
 releaseScheduledInAppNotifications:vi.fn(),
 releaseScheduledNotificationOutbox:vi.fn(),
 queueFencedCourseDueReminders:vi.fn(),
 queueFencedInterviewReminders:vi.fn(),
}));
vi.mock("@/modules/storage/production-scan-verdict-service",()=>({
 productionScannerCallbackReady:vi.fn(()=>true),
 applyProductionScanVerdict:vi.fn(async()=>({accepted:true,changed:true})),
}));

const scheduler=vi.mocked(executeScheduledJobWithLease);
const scanner=vi.mocked(applyProductionScanVerdict);
const ready=vi.mocked(productionScannerCallbackReady);
const schedulerKey="notification-scheduler-"+"n".repeat(48);
const scannerKey="storage-scanner-"+"s".repeat(48);
const schedulerUrl="https://lms.example.test/api/internal/operations/notification-scheduler";
const scannerUrl="https://lms.example.test/api/internal/storage/scan-verdict";
function req(url:string,{origin,headers={},body}:{origin?:string;
 headers?:Record<string,string>;body?:string}={}):Request{
 return new Request(url,{method:"POST",headers:{
  ...(body===undefined?{}:{"content-type":"application/json"}),
  ...headers,...(origin===undefined?{}:{origin}),
 },...(body===undefined?{}:{body})});
}
const body=JSON.stringify({jobName:"notification.cleanup"});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.stubEnv("DB10_NOTIFICATION_SCHEDULER_SECRET",schedulerKey);
 vi.stubEnv("DB10_NOTIFICATION_SCHEDULER_READY","DB10_VERIFIED");
 vi.stubEnv("PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET",scannerKey);
 ready.mockReturnValue(true);
 scanner.mockResolvedValue({accepted:true,changed:true} as never);
 scheduler.mockResolvedValue({ran:false,reason:"LOCKED"} as never);
});
afterEach(()=>vi.unstubAllEnvs());

describe("machine-only notification scheduler",()=>{
 it("blocks same-origin and foreign-origin browser calls even with a valid credential",async()=>{
  for(const origin of ["https://lms.example.test","https://outside.example.test","null"]){
   const response=await scheduledNotification(req(schedulerUrl,{origin,
    headers:{"x-notification-scheduler-key":schedulerKey},body}));
   expect(response.status).toBe(403);
   expect(response.headers.get("cache-control")).toBe("no-store");
  }
  expect(scheduler).not.toHaveBeenCalled();
 });
 it("fails closed when secret is short, padded or oversized",async()=>{
  for(const key of ["short"," x".repeat(40),"x".repeat(257)]){
   vi.stubEnv("DB10_NOTIFICATION_SCHEDULER_SECRET",key);
   const response=await scheduledNotification(req(schedulerUrl,{
    headers:{"x-notification-scheduler-key":key},body,
   }));
   // internalRoute() treats a missing, short, padded or oversized server secret as a denial (403), never as a pass.
   expect(response.status).toBe(403);
  }
  expect(scheduler).not.toHaveBeenCalled();
 });
 it("blocks wrong credential and unexpected query before invoking a job",async()=>{
  const bad=await scheduledNotification(req(schedulerUrl,{
   headers:{"x-notification-scheduler-key":"not-a-secret"},body,
  }));
  expect(bad.status).toBe(403);
  const query=await scheduledNotification(req(schedulerUrl+"?collegeId=foreign",{
   headers:{"x-notification-scheduler-key":schedulerKey},body,
  }));
  expect(query.status).toBe(400);
  expect(scheduler).not.toHaveBeenCalled();
 });
 it("denies unknown jobs, extra tenant selectors, invalid JSON and oversized worker bodies",async()=>{
  for(const [payload,expectedStatus] of [
   ['{"jobName":"unknown"}',503],
   ['{"jobName":"notification.cleanup","collegeId":"foreign"}',503],
   ['{"jobName":123}',503],
   ['not-json',400],
   ['x'.repeat(1025),400],
  ] as const){
   const result=await scheduledNotification(req(schedulerUrl,{
    headers:{"x-notification-scheduler-key":schedulerKey},body:payload,
   }));
   expect(result.status).toBe(expectedStatus);
   expect(result.headers.get("cache-control")).toBe("no-store");
  }
  expect(scheduler).not.toHaveBeenCalled();
 });
 it("preserves the legitimate single allowlisted scheduler job contract",async()=>{
  const response=await scheduledNotification(req(schedulerUrl,{
   headers:{"x-notification-scheduler-key":schedulerKey},body,
  }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ran:false,reason:"LOCKED"});
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(scheduler).toHaveBeenCalledOnce();
 });
});

describe("machine-only scanner callback",()=>{
 it("blocks both same-origin and foreign browser calls before scan verdict work",async()=>{
  for(const origin of ["https://lms.example.test","https://outside.example.test"]){
   const result=await scannerVerdict(req(scannerUrl,{origin,
    headers:{"x-private-storage-scanner-key":scannerKey},body:"{}",
   }));
   expect(result.status).toBe(403);
   expect(result.headers.get("cache-control")).toBe("no-store");
  }
  expect(scanner).not.toHaveBeenCalled();
 });
 it("refuses missing or wrong scanner credentials",async()=>{
  for(const key of [undefined,"not-a-secret"]){
   const result=await scannerVerdict(req(scannerUrl,{
    headers:key?{"x-private-storage-scanner-key":key}:{},body:"{}",
   }));
   expect(result.status).toBe(403);
  }
  expect(scanner).not.toHaveBeenCalled();
 });
 it("rejects query-string parameters before applying a verdict",async()=>{
  const result=await scannerVerdict(req(scannerUrl+"?collegeId=foreign",{
   headers:{"x-private-storage-scanner-key":scannerKey},body:"{}",
  }));
  expect(result.status).toBe(400);
  expect(scanner).not.toHaveBeenCalled();
 });
 it("keeps streamed payload limits and readiness gates enforced",async()=>{
  ready.mockReturnValueOnce(false);
  const unavailable=await scannerVerdict(req(scannerUrl,{
   headers:{"x-private-storage-scanner-key":scannerKey},body:"{}",
  }));
  expect(unavailable.status).toBe(503);
  const large=await scannerVerdict(req(scannerUrl,{
   headers:{"x-private-storage-scanner-key":scannerKey},body:"x".repeat(2049),
  }));
  expect(large.status).toBe(400);
  expect(scanner).not.toHaveBeenCalled();
 });
 it("never accepts non-JSON scanner callbacks or exposes provider failure details",async()=>{
  const nonJson=await scannerVerdict(req(scannerUrl,{
   headers:{"x-private-storage-scanner-key":scannerKey,"content-type":"text/plain"},body:"{}",
  }));
  expect(nonJson.status).toBe(400);
  expect(scanner).not.toHaveBeenCalled();
  scanner.mockRejectedValueOnce(new Error("private-scanner-secret-object-key"));
  const failed=await scannerVerdict(req(scannerUrl,{
   headers:{"x-private-storage-scanner-key":scannerKey},body:"{}",
  }));
  expect(failed.status).toBe(409);
  const response=await failed.text();
  expect(response).not.toContain("private-scanner-secret-object-key");
  expect(failed.headers.get("cache-control")).toBe("no-store");
 });
 it("retains authenticated valid scanner webhook behavior",async()=>{
  const input={kind:"PROJECT_RESOURCE_FILE",fileId:"11111111-1111-4111-8111-111111111111",
   collegeId:"22222222-2222-4222-8222-222222222222",verdict:"REJECTED"};
  const result=await scannerVerdict(req(scannerUrl,{
   headers:{"x-private-storage-scanner-key":scannerKey},body:JSON.stringify(input),
  }));
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({accepted:true,changed:true});
  expect(result.headers.get("cache-control")).toBe("no-store");
  expect(scanner).toHaveBeenCalledWith(input);
 });
});
