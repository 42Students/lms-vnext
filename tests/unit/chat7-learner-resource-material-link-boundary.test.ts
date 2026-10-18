import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 resourceMaterialLinkSchema,resourceMaterialCommandSchema,
 safeLearnerResourceMaterialHref,resourceMaterialsWriteReady,
} from "@/modules/courses/lesson-resource-materials-model";

const id="11111111-1111-4111-8111-111111111111";
const record=(externalUrl:string)=>({title:"Course materials",notes:null,externalUrl});
describe("LEARNER-RESOURCE-LINK-08 legacy and current course material URL safety",()=>{
 it("allows only normal HTTPS resource URLs without credentials or fragments",()=>{
  const url="https://university.example.edu/courses/lesson?file=lecture.pdf";
  expect(resourceMaterialLinkSchema.safeParse(record(url)).success).toBe(true);
  expect(safeLearnerResourceMaterialHref(url)).toBe(url);
  expect(safeLearnerResourceMaterialHref(null)).toBeNull();
 });
 it("rejects local/private and loopback targets in new authoring and old DB material reads",()=>{
  for(const url of [
   "http://university.example.edu/",
   "https://user:secret@university.example.edu/file",
   "https://university.example.edu/file#token",
   "javascript:alert(1)","file:///tmp/private",
   "https://localhost/private","https://dev.localhost/private",
   "https://127.0.0.1/admin","https://127.22.33.44/admin",
   "https://10.1.2.3/admin","https://192.168.1.1/admin",
   "https://172.16.8.1/admin","https://172.31.1.2/admin",
   "https://169.254.169.254/latest/meta-data/",
   "https://0.0.0.0/private","https://[::1]/private",
  ]){
   expect(resourceMaterialLinkSchema.safeParse(record(url)).success).toBe(false);
   expect(safeLearnerResourceMaterialHref(url)).toBeNull();
  }
 });
 it("denies a forged college, storage key, or unknown material command without writing",()=>{
  for(const payload of [
   {...record("https://university.example.edu"),action:"ADD_LINK",collegeId:id},
   {...record("https://university.example.edu"),action:"EDIT_LINK",materialId:id,storageKey:"private"},
   {action:"REMOVE",materialId:"not-a-uuid"},
   {action:"DELETE",materialId:id},
  ])expect(resourceMaterialCommandSchema.safeParse(payload).success).toBe(false);
  expect(resourceMaterialCommandSchema.safeParse({
   ...record("https://university.example.edu"),action:"ADD_LINK",
  }).success).toBe(true);
 });
 it("keeps disabled or unverified resource schema read/write features fail-closed",()=>{
  expect(resourceMaterialsWriteReady({DB05_RESOURCE_MATERIALS_READY:"DB05_VERIFIED"} as NodeJS.ProcessEnv)).toBe(true);
  expect(resourceMaterialsWriteReady({DB05_RESOURCE_MATERIALS_READY:"true"} as NodeJS.ProcessEnv)).toBe(false);
  expect(resourceMaterialsWriteReady({} as NodeJS.ProcessEnv)).toBe(false);
 });
 it("filters historical link hrefs in the service before any client receives a raw row",()=>{
  const source=readFileSync("src/modules/courses/lesson-resource-materials-service.ts","utf8");
  expect(source).toContain("safeLearnerResourceMaterialHref(row.externalUrl)");
  expect(source).toContain('row.kind==="LINK"');
  expect(source).toContain("await authorizeMaterial(context,contentId,deliveryId,false)");
  expect(source).toContain("lessonContentMaterials.lessonContentId,contentId");
 });
});
