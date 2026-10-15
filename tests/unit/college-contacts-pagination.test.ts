import {describe,it,expect} from "vitest";import {COLLEGE_CONTACTS_PAGE_SIZE,collegeContactsHref,collegeContactsQuerySchema} from "@/modules/people/college-contacts-model";describe("contacts pagination",()=>{it("keeps tab while changing page",()=>{expect(COLLEGE_CONTACTS_PAGE_SIZE).toBe(25);expect(collegeContactsHref(collegeContactsQuerySchema.parse({tab:"STUDENT",page:2}))).toContain("page=2");expect(collegeContactsQuerySchema.safeParse({page:10001}).success).toBe(false);});});
describe("contacts variable page size",()=>{it("preserves the bounded page size on navigation but excludes it from CSV schema",()=>{
 const large=collegeContactsQuerySchema.parse({tab:"FACULTY",page:3,pageSize:50});
 expect(collegeContactsHref(large)).toContain("pageSize=50");
 expect(collegeContactsQuerySchema.safeParse({pageSize:51}).success).toBe(false);
 expect(collegeContactsQuerySchema.parse({}).pageSize).toBe(25);
});});
