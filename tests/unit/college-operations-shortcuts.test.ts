import {describe,it,expect} from "vitest";import {collegeContactsHref,collegeContactsQuerySchema} from "@/modules/people/college-contacts-model";
describe("College Admin operations entry points",()=>{it("offers an own-college contacts link with no tenant query parameter",()=>{
 const href=collegeContactsHref(collegeContactsQuerySchema.parse({}));
 expect(href).toBe("/college/contacts");
 expect(href).not.toContain("collegeId");
});});