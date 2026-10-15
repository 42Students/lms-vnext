import {describe,expect,it} from "vitest";
import {collegeContactsQuerySchema} from "@/modules/people/college-contacts-model";
import {collegeContactsExportSchema} from "@/modules/people/college-contacts-export-model";
describe("contact public detail lookup contract",()=>{
 it("accepts exact UUID membership IDs on scoped read and CSV export, rejecting others",()=>{
  const membershipId="00000000-0000-4000-8000-000000000123";
  expect(collegeContactsQuerySchema.parse({membershipId}).membershipId).toBe(membershipId);
  expect(collegeContactsQuerySchema.safeParse({membershipId:"../../other-college"}).success).toBe(false);
  expect(collegeContactsExportSchema.safeParse({membershipId}).success).toBe(true);
  expect(collegeContactsExportSchema.safeParse({membershipId:"../../other-college"}).success).toBe(false);
 });
});
