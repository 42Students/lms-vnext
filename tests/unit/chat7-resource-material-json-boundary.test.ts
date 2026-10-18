import {describe,expect,it} from "vitest";
import {readResourceMaterialCommandJson} from "@/modules/courses/resource-material-command-json";
import {resourceMaterialCommandSchema} from "@/modules/courses/lesson-resource-materials-model";

const url="https://lms.example.edu/api/courses/lesson-contents/example/materials";
function request(body:string,extraHeaders:Record<string,string>={}){
 return new Request(url,{method:"POST",headers:{
  "Content-Type":"application/json",...extraHeaders,
 },body});
}
describe("LEARNER-RESOURCE-POST-11 bounded material command JSON parse",()=>{
 it("accepts a normal authorized-shape material action for downstream strict Zod validation",async()=>{
  const input={action:"ADD_LINK",title:"Course notes",notes:"Read section two",
   externalUrl:"https://university.example.edu/lecture"};
  const parsed=await readResourceMaterialCommandJson(request(JSON.stringify(input)));
  expect(resourceMaterialCommandSchema.safeParse(parsed).success).toBe(true);
 });
 it("rejects JSON arrays, primitives, null and malformed payloads before a service write",async()=>{
  for(const raw of ["[]","null","42","true",'"unsafe"',"","{invalid"]){
   await expect(readResourceMaterialCommandJson(request(raw))).rejects.toThrow();
  }
 });
 it("rejects oversized UTF-8 payloads even if the client omits Content-Length",async()=>{
  const big=JSON.stringify({action:"ADD_LINK",notes:"☃".repeat(6000)});
  expect(big.length).toBeLessThan(16_384);
  await expect(readResourceMaterialCommandJson(request(big))).rejects.toThrow("too large");
 });
 it("rejects a declared oversized request before streaming the body",async()=>{
  await expect(readResourceMaterialCommandJson(request("{}",{
   "Content-Length":"9999999",
  }))).rejects.toThrow("too large");
  await expect(readResourceMaterialCommandJson(request("{}",{
   "Content-Length":"NaN",
  }))).rejects.toThrow("too large");
 });
 it("does not let unknown keys evade strict authoring checks after safe JSON parsing",async()=>{
  const body=JSON.stringify({action:"REMOVE",materialId:"11111111-1111-4111-8111-111111111111",
   collegeId:"22222222-2222-4222-8222-222222222222"});
  const parsed=await readResourceMaterialCommandJson(request(body));
  expect(resourceMaterialCommandSchema.safeParse(parsed).success).toBe(false);
 });
});
