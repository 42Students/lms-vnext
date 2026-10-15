import {describe,expect,it} from "vitest";
import {collegeContactsQuerySchema,collegeContactsHref} from "@/modules/people/college-contacts-model";
describe("Faculty contacts tab",()=>{it("retains selected membership status when switching tabs",()=>{
 const state=collegeContactsQuerySchema.parse({status:"SUSPENDED"});
 expect(collegeContactsHref({...state,tab:"FACULTY"})).toContain("tab=FACULTY");
 expect(collegeContactsHref({...state,tab:"FACULTY"})).toContain("status=SUSPENDED");
});});