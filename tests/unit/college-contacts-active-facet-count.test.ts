import {describe,it,expect} from "vitest";
import {activeCollegeContactFilterCount,collegeContactsQuerySchema} from "@/modules/people/college-contacts-model";
describe("Contact applied-filter count",()=>{
 it("ignores tabs, page size, page number and sort",()=>{expect(activeCollegeContactFilterCount(collegeContactsQuerySchema.parse({tab:"FACULTY",page:3,pageSize:50,sort:"NEWEST"}))).toBe(0);});
 it("counts only non-default actual fields",()=>{expect(activeCollegeContactFilterCount(collegeContactsQuerySchema.parse({q:"Ada",facultyTitleQ:"Professor",status:"SUSPENDED"}))).toBe(3);});
 it("includes a bookmarked exact contact membership",()=>{expect(activeCollegeContactFilterCount(collegeContactsQuerySchema.parse({membershipId:"022a400d-47d5-4574-8b79-c98cba999000"}))).toBe(1);});
});
