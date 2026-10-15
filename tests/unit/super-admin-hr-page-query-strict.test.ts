import {describe,it,expect} from "vitest";
import {parseSuperAdminHrPageParams as parse} from "@/modules/placements/super-admin-hr-validation";
describe("Super Admin recruiter account query",()=>{
 it("uses defaults for blank controls",()=>{
  expect(parse({q:"   ",status:"",page:"",pageSize:""})).toMatchObject({page:1,pageSize:25});
 });
 it("trims and validates search and persisted account status",()=>{
  expect(parse({q:" ACME ",status:"ACTIVE"})?.q).toBe("ACME");
  expect(parse({status:"REMOVED"})).toBeNull();
 });
 it("denies duplicates and unknown keys",()=>{
  expect(parse({status:["ACTIVE","ARCHIVED"]})).toBeNull();
  expect(parse({organizationId:"someone-else"})).toBeNull();
 });
 it("rejects out-of-range pagination",()=>{
  expect(parse({page:"0"})).toBeNull();
  expect(parse({pageSize:"1000"})).toBeNull();
 });
});
