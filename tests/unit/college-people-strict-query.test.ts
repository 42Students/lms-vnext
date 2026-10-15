import {describe,it,expect} from "vitest";
import {parseCollegePeopleDirectorySearchParams} from "@/modules/people/college-people-directory-model";
describe("College People directory rejects ambiguous or foreign scope",()=>{
 it("rejects duplicate filters rather than choosing a lucky first value",()=>{expect(()=>parseCollegePeopleDirectorySearchParams({role:["LEARNER","FACULTY"]})).toThrow();});
 it("rejects forged collegeId and prototype-like parameters",()=>{expect(()=>parseCollegePeopleDirectorySearchParams({collegeId:"forged"})).toThrow();expect(()=>parseCollegePeopleDirectorySearchParams(Object.fromEntries([["__proto__","forged"]]))).toThrow();});
 it("allows empty HTML form defaults and valid paging",()=>{expect(parseCollegePeopleDirectorySearchParams({q:"",page:"2",role:"LEARNER"})).toMatchObject({q:"",page:2,role:"LEARNER"});});
});
