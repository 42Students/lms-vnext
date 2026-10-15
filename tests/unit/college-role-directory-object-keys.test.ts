import {describe,it,expect} from "vitest";
import {parseCollegeRoleDirectorySearchParams} from "@/modules/people/college-role-directory-model";
describe("College role directory rejects prototype-chain filter keys",()=>{
 it("rejects inherited property names instead of silently trusting them",()=>{
  for(const key of ["__proto__","constructor","toString"]){
   const input=Object.fromEntries([[key,"forged"]]);
   expect(()=>parseCollegeRoleDirectorySearchParams(input)).toThrow("INVALID_ROLE_DIRECTORY_FILTERS");
  }
 });
 it("does not choose a first value from duplicate search values",()=>{
  expect(()=>parseCollegeRoleDirectorySearchParams({status:["ACTIVE","ENDED"]})).toThrow("INVALID_ROLE_DIRECTORY_FILTERS");
 });
 it("accepts legitimate filters",()=>{
  expect(parseCollegeRoleDirectorySearchParams({status:"ACTIVE",page:"2"})).toMatchObject({status:"ACTIVE",page:2});
 });
});
