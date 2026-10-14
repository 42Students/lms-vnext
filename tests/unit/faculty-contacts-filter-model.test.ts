import {describe,expect,it} from "vitest";
import {parseFacultyContactsQuery} from "@/modules/courses/faculty-contacts-filter-model";
describe("Faculty Contacts full query selector boundary",()=>{
 it("keeps expected search and page-size defaults",()=>{
  expect(parseFacultyContactsQuery({})).toEqual({search:"",page:1,pageSize:10});
  expect(parseFacultyContactsQuery({q:"  Ada  ",page:"2",pageSize:"50"}))
   .toEqual({search:"Ada",page:2,pageSize:50});
 });
 it("rejects duplicate, unknown, and unsupported page selectors",()=>{
  for(const raw of [{q:["A","B"]},{page:["1","2"]},{page:"0"},
   {page:"-1"},{page:"100000"},{pageSize:"100"},{collegeId:"foreign"},
   {q:"x".repeat(201)}]){
   expect(parseFacultyContactsQuery(raw)).toBeNull();
  }
 });
});
