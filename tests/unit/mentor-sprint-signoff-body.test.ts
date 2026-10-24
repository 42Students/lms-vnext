import {describe,expect,it} from "vitest";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {MENTOR_SIGNOFF_MAX_BODY_BYTES} from
 "@/modules/projects/mentor-sprint-signoff-request-policy";

describe("Mentor Sprint sign-off streamed request boundary",()=>{
 const payload=JSON.stringify({
   note:"x".repeat(1000),startNextSprint:true,
   nextSprintId:"11111111-1111-4111-8111-111111111111",
   decisions:Array.from({length:250},(_,i)=>({
     taskId:"22222222-2222-4222-8222-"+String(i).padStart(12,"0"),
     destination:i%3===0?"NEXT":i%3===1?"BACKLOG":"DROP",
     expectedUpdatedAt:"2026-10-24T12:00:00.000Z",
   })),
 });
 it("supports all 250 task decisions and the max sign-off note",async()=>{
   expect(new TextEncoder().encode(payload).byteLength).toBeGreaterThan(4096);
   expect(new TextEncoder().encode(payload).byteLength).toBeLessThan(MENTOR_SIGNOFF_MAX_BODY_BYTES);
   const result=await readBoundedUtf8Body(new Request("https://lms.example/complete",{
     method:"POST",body:payload,
   }),MENTOR_SIGNOFF_MAX_BODY_BYTES);
   expect(result).toEqual({kind:"OK",body:payload});
 });
 it("rejects more than 64KiB before buffering the full body",async()=>{
   const result=await readBoundedUtf8Body(new Request("https://lms.example/complete",{
     method:"POST",body:"x".repeat(MENTOR_SIGNOFF_MAX_BODY_BYTES+1),
   }),MENTOR_SIGNOFF_MAX_BODY_BYTES);
   expect(result).toEqual({kind:"TOO_LARGE"});
 });
 it("does not replace malformed UTF-8 with the replacement glyph",async()=>{
   const result=await readBoundedUtf8Body(new Request("https://lms.example/complete",{
     method:"POST",body:new Uint8Array([123,34,120,34,58,34,255,34,125]),
   }),MENTOR_SIGNOFF_MAX_BODY_BYTES);
   expect(result).toEqual({kind:"INVALID_UTF8"});
 });
 it("keeps a blank request compatible with no-decision sign-off",async()=>{
   const result=await readBoundedUtf8Body(new Request("https://lms.example/complete",{
     method:"POST",
   }),MENTOR_SIGNOFF_MAX_BODY_BYTES);
   expect(result).toEqual({kind:"OK",body:""});
 });
});
