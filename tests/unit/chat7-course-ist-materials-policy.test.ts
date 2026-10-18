import {describe,expect,it} from "vitest";
import {parseCollegeIstLocal} from "@/modules/courses/college-ist-datetime-model";
import {resourceMaterialCommandSchema,resourceMaterialsWriteReady} from "@/modules/courses/lesson-resource-materials-model";
import {learnerAssignmentHttpsLinkSchema} from "@/modules/courses/learner-assignment-link-model";

const materialId="11111111-1111-4111-8111-111111111111";
describe("Course authoring IST and learner material attack surface",()=>{
 it("COURSE-IST-01 preserves India's 5:30 UTC offset at month/year boundaries and leap days",()=>{
  expect(parseCollegeIstLocal("2099-01-01T00:00")).toBe("2098-12-31T18:30:00.000Z");
  expect(parseCollegeIstLocal("2000-02-29T23:59")).toBe("2000-02-29T18:29:00.000Z");
  expect(parseCollegeIstLocal("2099-07-01T05:30")).toBe("2099-07-01T00:00:00.000Z");
 });
 it("COURSE-IST-01 rejects overflow calendar dates, missing timezone-neutral components and invalid clock bounds",()=>{
  for(const input of ["2099-02-29T12:00","2099-04-31T00:00","2099-01-01T24:00",
    "2099-01-01T23:60","2099-01-01","1999-12-31T23:59","2099-00-01T12:00",
    "2099-01-01T12:00Z","2099-01-01T12:00+05:30"]){
   expect(parseCollegeIstLocal(input)).toBeNull();
  }
 });
 it("LEARNER-resource-07 permits credential-free HTTPS links and strict material command shapes",()=>{
  const valid={action:"ADD_LINK",title:"Reference",externalUrl:"https://example.edu/course",
   notes:null};
  expect(resourceMaterialCommandSchema.safeParse(valid).success).toBe(true);
  expect(resourceMaterialCommandSchema.safeParse({...valid,action:"EDIT_LINK",materialId}).success).toBe(true);
  expect(resourceMaterialCommandSchema.safeParse({action:"REMOVE",materialId}).success).toBe(true);
  expect(resourceMaterialCommandSchema.safeParse({action:"REMOVE",materialId,externalUrl:valid.externalUrl}).success).toBe(false);
 });
 it("LEARNER-resource-07 rejects javascript, HTTP, credentials, anchors and unexpected storage authority",()=>{
  for(const url of [
   "javascript:alert(1)","http://example.edu/course",
   "https://user:pass@example.edu/","https://example.edu/course#secret",
   "file:///etc/passwd","not a url",
  ])expect(resourceMaterialCommandSchema.safeParse({
    action:"ADD_LINK",title:"Reference",externalUrl:url,
  }).success).toBe(false);
  expect(resourceMaterialCommandSchema.safeParse({
   action:"ADD_LINK",title:"A",externalUrl:"https://example.edu/",storageKey:"other-tenant",
  }).success).toBe(false);
  expect(learnerAssignmentHttpsLinkSchema.safeParse("http://example.edu").success).toBe(false);
  expect(learnerAssignmentHttpsLinkSchema.safeParse("https://example.edu/").success).toBe(true);
 });
 it("LEARNER-resource-07 requires explicitly verified material storage, never just a truthy environment variable",()=>{
  expect(resourceMaterialsWriteReady({DB05_RESOURCE_MATERIALS_READY:"DB05_VERIFIED"})).toBe(true);
  expect(resourceMaterialsWriteReady({DB05_RESOURCE_MATERIALS_READY:"true"})).toBe(false);
  expect(resourceMaterialsWriteReady({})).toBe(false);
 });
});
