import {beforeEach,describe,expect,it,vi} from "vitest";
const fake=vi.hoisted(()=>({context:vi.fn(),save:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fake.context}));
vi.mock("@/modules/projects/mentor-email-preference-service",()=>({
 saveMentorEmailPreference:fake.save,
}));
import {POST} from "@/app/api/mentor/preferences/email/route";
const own="11111111-1111-4111-8111-111111111111";
const req=(body:string,origin="https://lms.example")=>
 new Request("https://lms.example/api/mentor/preferences/email",{
  method:"POST",headers:{host:"lms.example",origin},body,
 });
describe("Mentor email preference HTTP boundary",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  fake.context.mockResolvedValue({user:{id:own}});
  fake.save.mockResolvedValue({enabled:true,version:own});
 });
 it("blocks hostile origins before auth",async()=>{
  const result=await POST(req('{"enabled":true,"expectedVersion":null}',
   "https://attacker.example"));
  expect(result.status).toBe(403);
  expect(fake.context).not.toHaveBeenCalled();
  expect(fake.save).not.toHaveBeenCalled();
 });
 it("rejects malformed and identity-injected preferences before a write",async()=>{
  for(const input of ['bad json','{"enabled":"yes","expectedVersion":null}',
    '{"enabled":true,"expectedVersion":null,"userId":"injected"}']){
   const response=await POST(req(input));
   expect(response.status).toBe(400);
  }
  expect(fake.save).not.toHaveBeenCalled();
 });
 it("passes only an enabled flag and opaque CAS version to authorised service",async()=>{
  const result=await POST(req('{"enabled":true,"expectedVersion":null}'));
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toContain("no-store");
  expect(fake.save).toHaveBeenCalledWith({user:{id:own}},{
   enabled:true,expectedVersion:null,
  });
 });
});
