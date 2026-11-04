import { beforeEach, describe, expect, it, vi } from "vitest";
const fakes=vi.hoisted(()=>({context:vi.fn(),origin:vi.fn(),
 load:vi.fn(),save:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fakes.context}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:fakes.origin}));
vi.mock("@/modules/people/identity-profile-service",()=>({
 getOwnIdentityProfile:fakes.load,updateOwnIdentityName:fakes.save,
}));
import { GET, PATCH } from "@/app/api/auth/profile/route";
const ctx={user:{id:"11111111-1111-4111-8111-111111111111",platformStatus:"ACTIVE"}};
const req=(body:string)=>new Request("https://lms.example/api/auth/profile",{
 method:"PATCH",headers:{"host":"lms.example","origin":"https://lms.example",
  "content-type":"application/json"},body,
});
describe("DB-004 first-party self identity profile HTTP boundary",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  fakes.context.mockResolvedValue(ctx);fakes.origin.mockReturnValue(true);
  fakes.load.mockResolvedValue({givenName:null,familyName:null,
    displayName:"Example",version:1,email:"owner@example.test"});
  fakes.save.mockResolvedValue({givenName:"Mary Ann",familyName:"van der Berg",
    displayName:"Mary Ann van der Berg",version:2,email:"owner@example.test"});
 });
 it("rejects forged origin before loading the user context",async()=>{
  fakes.origin.mockReturnValue(false);
  const reply=await PATCH(req('{"name":{"givenName":"Mary"},"expectedVersion":1}'));
  expect(reply.status).toBe(403);expect(fakes.context).not.toHaveBeenCalled();
  expect(fakes.save).not.toHaveBeenCalled();
 });
 it("rejects malformed bodies, credential rewrites and arbitrary target user IDs",async()=>{
  for(const body of ["{not-json",
    '{"name":{"givenName":"Mary"},"expectedVersion":1,"userId":"foreign"}',
    '{"name":{"givenName":"Mary","email":"attacker@example.test"},"expectedVersion":1}',
    '{"name":{"givenName":"Mary"},"expectedVersion":0}',
    " ".repeat(8200)]){
   const result=await PATCH(req(body));
   expect([400,413]).toContain(result.status);
  }
  expect(fakes.save).not.toHaveBeenCalled();
 });
 it("uses the current context with only validated canonical name parts",async()=>{
  const result=await PATCH(req('{"name":{"givenName":"Mary Ann","familyName":"van der Berg"},"expectedVersion":1}'));
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toContain("no-store");
  expect(fakes.save).toHaveBeenCalledWith(ctx,{
    givenName:"Mary Ann",familyName:"van der Berg"},1);
 });

 it("caps multibyte profile bodies by UTF-8 bytes rather than code units",async()=>{
  const body=JSON.stringify({name:{givenName:"漢".repeat(2800)},expectedVersion:1});
  expect(body.length).toBeLessThan(8192);
  expect(new TextEncoder().encode(body).length).toBeGreaterThan(8192);
  const result=await PATCH(req(body));
  expect(result.status).toBe(413);
  expect(await result.json()).toEqual({error:"REQUEST_TOO_LARGE"});
  expect(fakes.context).not.toHaveBeenCalled();
  expect(fakes.save).not.toHaveBeenCalled();
 });
 it("caps streamed profile bodies without trusting Content-Length",async()=>{
  const stream=new ReadableStream<Uint8Array>({
   start(controller) {
    controller.enqueue(new TextEncoder().encode('{"name":{"givenName":"Mary"},'));
    controller.enqueue(new TextEncoder().encode(" ".repeat(8200)));
    controller.enqueue(new TextEncoder().encode('"expectedVersion":1}'));
    controller.close();
   },
  });
  const request=new Request("https://lms.example/api/auth/profile",{
   method:"PATCH",
   headers:{host:"lms.example",origin:"https://lms.example","content-type":"application/json"},
   body:stream,duplex:"half",
  } as RequestInit&{duplex:"half"});
  const result=await PATCH(request);
  expect(result.status).toBe(413);
  expect(fakes.context).not.toHaveBeenCalled();
  expect(fakes.save).not.toHaveBeenCalled();
 });
 it("rejects missing and invalid UTF-8 JSON bodies without mutation",async()=>{
  const noBody=new Request("https://lms.example/api/auth/profile",{
   method:"PATCH",headers:{host:"lms.example",origin:"https://lms.example"},
  });
  expect((await PATCH(noBody)).status).toBe(400);
  const invalidUtf8=new Request("https://lms.example/api/auth/profile",{
   method:"PATCH",headers:{host:"lms.example",origin:"https://lms.example",
    "content-type":"application/json"},body:new Uint8Array([0x7b,0xff,0x7d]),
  });
  expect((await PATCH(invalidUtf8)).status).toBe(400);
  expect(fakes.context).not.toHaveBeenCalled();
  expect(fakes.save).not.toHaveBeenCalled();
 });
 it("reads the authenticated person's own profile with no-store semantics",async()=>{
  const result=await GET();
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toContain("no-store");
  expect(fakes.load).toHaveBeenCalledWith(ctx);
 });
});
