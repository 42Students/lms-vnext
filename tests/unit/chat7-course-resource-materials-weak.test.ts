import {describe,expect,it} from "vitest";
import {resourceMaterialLinkSchema,resourceMaterialCommandSchema,
 resourceMaterialsWriteReady,resourceMaterialIdSchema} from "@/modules/courses/lesson-resource-materials-model";

const id="11111111-1111-4111-8111-111111111111";
const valid={title:"Course notes",externalUrl:"https://school.invalid/notes.pdf"};
describe("COURSES-WEAK-RESOURCE-MATERIALS-01 real resource lifecycle validation",()=>{
 it("permits only titled, credential-free HTTPS resources without fragments",()=>{
  const parsed=resourceMaterialLinkSchema.parse({...valid,title:"  Week 2 notes  "});
  expect(parsed.title).toBe("Week 2 notes");
  expect(parsed.notes).toBeNull();
  for(const url of ["http://school.invalid/notes.pdf","javascript:alert(1)",
   "file:///tmp/notes.pdf","https://user:pass@school.invalid/notes.pdf",
   "https://school.invalid/notes.pdf#token","not a url"]){
   expect(resourceMaterialLinkSchema.safeParse({...valid,externalUrl:url}).success).toBe(false);
  }
  expect(resourceMaterialLinkSchema.safeParse({...valid,title:" "}).success).toBe(false);
  expect(resourceMaterialLinkSchema.safeParse({...valid,title:"X".repeat(256)}).success).toBe(false);
  expect(resourceMaterialLinkSchema.safeParse({...valid,notes:"x".repeat(2001)}).success).toBe(false);
 });
 it("only known ADD_LINK, EDIT_LINK and REMOVE actions are permitted, with persisted IDs where required",()=>{
  expect(resourceMaterialCommandSchema.safeParse({action:"ADD_LINK",...valid}).success).toBe(true);
  expect(resourceMaterialCommandSchema.safeParse({action:"EDIT_LINK",materialId:id,...valid}).success).toBe(true);
  expect(resourceMaterialCommandSchema.safeParse({action:"REMOVE",materialId:id}).success).toBe(true);
  for(const input of [
   {action:"REMOVE",materialId:"other-college"},
   {action:"REMOVE",materialId:id,externalUrl:valid.externalUrl},
   {action:"EDIT_LINK",...valid},
   {action:"ADD_FILE",...valid},
   {action:"ADD_LINK",...valid,storageKey:"steal"},
  ])expect(resourceMaterialCommandSchema.safeParse(input).success).toBe(false);
  expect(resourceMaterialIdSchema.safeParse(id).success).toBe(true);
  expect(resourceMaterialIdSchema.safeParse("foreign").success).toBe(false);
 });
 it("cannot write resource materials when deployment migration is not explicitly verified",()=>{
  for(const flag of ["",undefined,"DB05_STAGED","db05_verified","true"]){
   const env:NodeJS.ProcessEnv=flag===undefined?{...process.env,DB05_RESOURCE_MATERIALS_READY:undefined}:{...process.env,DB05_RESOURCE_MATERIALS_READY:flag};
   expect(resourceMaterialsWriteReady(env)).toBe(false);
  }
  expect(resourceMaterialsWriteReady({...process.env,DB05_RESOURCE_MATERIALS_READY:"DB05_VERIFIED"})).toBe(true);
 });
});
