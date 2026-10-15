import {describe,it,expect} from "vitest";
import {collegeVerificationFilterError,parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
describe("College verification rejects ambiguous or contradictory queries without reading data",()=>{
 it("rejects duplicate parameters and prototype-like keys",()=>{
  expect(parseCollegeVerificationPageQuery({tab:["WAITING","VERIFIED"]}).success).toBe(false);
  expect(parseCollegeVerificationPageQuery(Object.fromEntries([["__proto__","forged"]])).success).toBe(false);
  expect(collegeVerificationFilterError({tab:["WAITING","VERIFIED"]})).toMatch(/Repeated/);
 });
 it("gives specific safe reasons for impossible filters",()=>{
  expect(collegeVerificationFilterError({tab:"VERIFIED",waitingState:"SUBMITTED"})).toMatch(/Waiting/);
  expect(collegeVerificationFilterError({kind:"IDENTITY",marksheets:"MISSING"})).toMatch(/Identity/);
  expect(collegeVerificationFilterError({submittedFrom:"2026-10-16",waitingSince:"2026-10-14"})).toMatch(/start date/);
 });
 it("does not reflect query secrets",()=>{
  const value="secret-token@another-college";
  expect(collegeVerificationFilterError({q:value,unknown:"x"})).not.toContain(value);
 });
});
