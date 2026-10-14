import {describe,expect,it} from "vitest";
import {mentorResourceDirectory,mentorResourceDirectoryHref,mentorResourceDirectoryQuerySchema} from "@/modules/projects/mentor-resource-directory-model";
describe("Mentor safe resource links",()=>{
 const projectId="72baac51-ac4e-4abd-8c58-ac0526053c83";
 const rows=[
  {id:"a",title:"Safe",description:null,url:"https://example.org/help",required:true,sequence:1},
  {id:"b",title:"Unsafe",description:null,url:"javascript:alert(1)",required:false,sequence:2},
 ];
 it("filters actual link availability for list and CSV",()=>{
  const yes=mentorResourceDirectoryQuerySchema.parse({projectId,link:"HTTPS"});
  expect(mentorResourceDirectory(rows,yes).items.map(x=>x.id)).toEqual(["a"]);
  const no=mentorResourceDirectoryQuerySchema.parse({projectId,link:"UNAVAILABLE"});
  expect(mentorResourceDirectory(rows,no).exportItems.map(x=>x.id)).toEqual(["b"]);
  expect(mentorResourceDirectoryHref(no)).toContain("link=UNAVAILABLE");
 });
 it("rejects unknown selectors and scope overrides",()=>{
  expect(mentorResourceDirectoryQuerySchema.safeParse({projectId,link:"FILE"}).success).toBe(false);
  expect(mentorResourceDirectoryQuerySchema.safeParse({projectId,collegeId:"x"}).success).toBe(false);
 });
});
