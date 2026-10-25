import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
const fake=vi.hoisted(()=>({ready:vi.fn(),run:vi.fn()}));
vi.mock("@/modules/projects/mentor-project-email-dispatch-worker",()=>({
 mentorProjectEmailWorkerReady:fake.ready,
 runMentorProjectEmailDispatchBatch:fake.run,
}));
import {POST} from "@/app/api/internal/mentor-project-email-dispatch/route";
const secret="s".repeat(64);
const original=process.env["MENTOR_PROJECT_EMAIL_WORKER_TOKEN"];
const req=(token:string)=>
 new Request("https://lms.example/api/internal/mentor-project-email-dispatch",{
  method:"POST",headers:{authorization:"Bearer "+token},
 });
describe("Mentor background email dispatch authorization",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  process.env["MENTOR_PROJECT_EMAIL_WORKER_TOKEN"]=secret;
  fake.ready.mockReturnValue({ready:true,activatedAt:new Date("2026-10-25T00:00:00Z")});
  fake.run.mockResolvedValue({status:"CHECKED",
   examined:2,accepted:1,suppressed:1,retry:0});
 });
 afterEach(()=>{
  if(original===undefined)delete process.env["MENTOR_PROJECT_EMAIL_WORKER_TOKEN"];
  else process.env["MENTOR_PROJECT_EMAIL_WORKER_TOKEN"]=original;
 });
 it("blocks all missing or forged tokens before any database work",async()=>{
  for(const token of ["","bad","s".repeat(63),"a".repeat(64)]){
   expect((await POST(req(token))).status).toBe(403);
  }
  expect(fake.run).not.toHaveBeenCalled();
 });
 it("fails closed on unprovisioned provider readiness",async()=>{
  fake.ready.mockReturnValue({ready:false});
  expect((await POST(req(secret))).status).toBe(503);
  expect(fake.run).not.toHaveBeenCalled();
 });
 it("runs a bounded internal batch with no source IDs from the caller",async()=>{
  const response=await POST(req(secret));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(fake.run).toHaveBeenCalledTimes(1);
  expect(await response.json()).toEqual({
   status:"CHECKED",examined:2,accepted:1,suppressed:1,retry:0,
  });
 });
});
