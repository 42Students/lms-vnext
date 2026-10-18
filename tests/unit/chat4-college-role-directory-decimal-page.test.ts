import {describe,expect,it} from "vitest";
import {
  collegeRoleDirectoryQuerySchema,
  parseCollegeRoleDirectorySearchParams,
  canonicalCollegeRoleDirectoryHref,
  collegeRoleDirectoryHref,
  assertCompatibleCollegeRoleDirectoryFilters,
} from "@/modules/people/college-role-directory-model";

describe("COL-people-directory-PAGE-01 exact decimal College People directory pagination",()=>{
 it("accepts legitimate default and legacy 10/25/50 choices without losing filters",()=>{
  expect(parseCollegeRoleDirectorySearchParams({})).toMatchObject({page:1,pageSize:25,q:""});
  const chosen=parseCollegeRoleDirectorySearchParams({
   q:"  Computer Science  ",page:"0002",pageSize:"50",status:"ACTIVE",
  });
  expect(chosen).toMatchObject({q:"Computer Science",page:2,pageSize:50,status:"ACTIVE"});
  expect(collegeRoleDirectoryQuerySchema.parse({page:10000,pageSize:10})).toMatchObject({
   page:10000,pageSize:10,
  });
 });
 it("rejects ambiguous coercion, forged extra parameters, repeats and empty numeric controls",()=>{
  const bad=[
   {page:"0x10"},{page:"1e2"},{page:" 2 "},{page:"1.0"},
   {page:"Infinity"},{page:"0"},{page:"10001"},{page:""},
   {pageSize:"0x19"},{pageSize:"2.5e1"},{pageSize:" 25 "},
   {pageSize:""},{pageSize:"20"},{page:["1","2"]},
   {pageSize:["10","25"]},{unknown:""},{collegeId:"another-tenant"},
  ];
  for(const params of bad){
   expect(()=>parseCollegeRoleDirectorySearchParams(params)).toThrow();
  }
 });
 it("holds the same normal validated paging through canonical navigation",()=>{
  const query=parseCollegeRoleDirectorySearchParams({
   page:"9",pageSize:"50",q:"  learner  ",status:"ACTIVE",
  });
  expect(collegeRoleDirectoryHref("LEARNER",query)).toContain("page=9");
  expect(collegeRoleDirectoryHref("LEARNER",query)).toContain("pageSize=50");
  const replacement=canonicalCollegeRoleDirectoryHref("LEARNER",query,3);
  expect(replacement).toContain("page=3");
  expect(replacement).toContain("pageSize=50");
  expect(replacement).toContain("q=learner");
  expect(replacement).toContain("status=ACTIVE");
 });
 it("does not reclassify faculty-only filters as a student directory merely by changing URL labels",()=>{
  const filter=parseCollegeRoleDirectorySearchParams({teachingRole:"PRIMARY"});
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",filter)).toThrow();
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("FACULTY",filter)).not.toThrow();
 });
});
