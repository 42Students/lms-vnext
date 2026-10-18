import {describe,expect,it} from "vitest";
import {
 tpoCompanyTeamPostSchema,tpoCompanyTeamCompanyIdSchema,canPostToTpoCompanyTeam,
} from "@/modules/placements/tpo-company-team-model";
import {companyTeamCompanyIdSchema} from "@/modules/placements/tpo-company-team-service";

const COMPANY="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const KEY="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
describe("TPO-companies-05 private company discussion strict input and archive state",()=>{
 it("accepts a bounded, idempotent message without storing surrounding spaces",()=>{
  const parsed=tpoCompanyTeamPostSchema.parse({
   body:"  Request updated  ",idempotencyKey:KEY,
  });
  expect(parsed).toEqual({body:"Request updated",idempotencyKey:KEY});
  expect(tpoCompanyTeamCompanyIdSchema.parse(COMPANY)).toBe(COMPANY);
  expect(companyTeamCompanyIdSchema.parse(COMPANY)).toBe(COMPANY);
 });
 it("refuses arbitrary client-provided college scope, missing key and malformed bytes",()=>{
  for(const bad of [
   {body:"Note"},
   {body:"Note",idempotencyKey:"not-uuid"},
   {body:"Note",idempotencyKey:KEY,collegeId:COMPANY},
   {body:"Note",idempotencyKey:KEY,authorMembershipId:COMPANY},
   {body:"Note",idempotencyKey:KEY,action:"DELETE"},
   {body:"\t\r\n",idempotencyKey:KEY},
   {body:"x".repeat(4001),idempotencyKey:KEY},
  ])expect(tpoCompanyTeamPostSchema.safeParse(bad).success).toBe(false);
  for(const invalid of ["", "../other-college", "abc", "not-a-uuid"])
   expect(companyTeamCompanyIdSchema.safeParse(invalid).success).toBe(false);
 });
 it("never treats missing, suspended, archived or deleted company links as postable",()=>{
  for(const status of ["ARCHIVED","DELETED","SUSPENDED","", "PENDING", "active"])
   expect(canPostToTpoCompanyTeam(status)).toBe(false);
  expect(canPostToTpoCompanyTeam("ACTIVE")).toBe(true);
 });
});
