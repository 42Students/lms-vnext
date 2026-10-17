import {describe,expect,it} from "vitest";
import {mentorProjectListQuerySchema} from "@/modules/projects/mentor-project-list-query";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
describe("mentor project legacy query compatibility",()=>{
 it("MEN-projects-meetings-R10 accepts legacy page-zero and ignores unrelated URL selectors without weakening the strict write and query validation",()=>{
  expect(mentorProjectListQuerySchema.parse({page:"0",pageSize:"10",status:"IN_PROGRESS"})).toMatchObject({page:1,pageSize:10,status:"IN_PROGRESS"});
  expect(mentorProjectListQuerySchema.parse({page:0})).toMatchObject({page:1});
  expect(mentorProjectListQuerySchema.safeParse({page:"-1"}).success).toBe(false);
  expect(mentorProjectListQuerySchema.safeParse({collegeId:"forged"}).success).toBe(false);
  const scoped=singleValueMentorFilters({page:"0",status:"BLOCKED",unknown:"value",collegeId:"foreign"});
  expect(scoped).toEqual({page:"0",status:"BLOCKED"});
  expect(mentorProjectListQuerySchema.parse(scoped)).toMatchObject({page:1,status:"BLOCKED"});
  expect(singleValueMentorFilters({search:["a","b"]})).toBeNull();
  expect(singleValueMentorFilters({search:"valid",unknown:["one","two"]})).toEqual({search:"valid"});
 });
});
