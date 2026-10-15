import {describe,it,expect} from "vitest";
import {appendUniqueRoleExportRows} from "@/modules/people/college-role-directory-export";
import type {CollegeRoleDirectoryRow} from "@/modules/people/college-role-directory-model";
describe("College role-specific CSV deduplication",()=>{
 const make=(id:string):CollegeRoleDirectoryRow=>({membershipId:id,name:id,email:null,membershipStatus:"ACTIVE",userStatus:"ACTIVE",joinedAt:new Date("2026-10-15T00:00:00Z"),program:null,cohort:null,sections:[],activeTeachingAssignments:0});
 it("returns each membership once even across shifting directory pages",()=>{
  const rows:CollegeRoleDirectoryRow[]=[];
  appendUniqueRoleExportRows(rows,[make("a"),make("b")]);
  appendUniqueRoleExportRows(rows,[make("b"),make("c")]);
  expect(rows.map(row=>row.membershipId)).toEqual(["a","b","c"]);
 });
});
