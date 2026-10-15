import {describe,it,expect} from "vitest";
import {parseSuperAdminReadinessParams as parse} from "@/modules/colleges/admin-readiness-filter";
describe("college readiness URL state",()=>{
 it("normalizes blank default controls",()=>expect(parse({status:"",area:""})).toEqual({status:"ALL",area:"ALL"}));
 it("accepts documented filters",()=>expect(parse({status:"NEEDS_ATTENTION",area:"DOMAINS"})).toEqual({status:"NEEDS_ATTENTION",area:"DOMAINS"}));
 it("denies duplicate or forged scopes",()=>{
  expect(parse({status:["PASS","FAIL"]})).toBeNull();
  expect(parse({collegeId:"override"})).toBeNull();
 });
 it("denies unknown status and area",()=>{
  expect(parse({status:"PROVISIONAL"})).toBeNull();
  expect(parse({area:"UNSAFE"})).toBeNull();
 });
});
