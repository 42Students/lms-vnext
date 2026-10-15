import {describe,it,expect} from "vitest";
import {CONTACT_EXPORT_LIMIT,collegeContactsExportSchema} from "@/modules/people/college-contacts-export-model";
describe("college contact export read contract",()=>{it("never trusts supplied tenant ids",()=>{
 expect(CONTACT_EXPORT_LIMIT).toBe(1000);
 expect(collegeContactsExportSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
 expect(collegeContactsExportSchema.safeParse({tab:"STUDENT",q:"ABC"}).success).toBe(true);
});});
