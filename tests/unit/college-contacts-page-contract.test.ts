import {describe,expect,it} from "vitest";
import {collegeContactsQuerySchema} from "@/modules/people/college-contacts-model";
describe("contacts landing",()=>{it("defaults to a current-college All contacts view",()=>{
 expect(collegeContactsQuerySchema.parse({})).toMatchObject({tab:"ALL",status:"ACTIVE",page:1});
});});