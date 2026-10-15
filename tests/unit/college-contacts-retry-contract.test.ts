import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema} from "@/modules/people/college-contacts-model";
describe("contacts recovery",()=>{it("has a valid reset route state",()=>{
 expect(collegeContactsQuerySchema.parse({})).toMatchObject({q:"",page:1,tab:"ALL"});
});});