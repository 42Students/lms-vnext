import {describe,it,expect} from "vitest";
import {contactRecordLinks} from "@/modules/people/college-contacts-links";
describe("contact drill-down links",()=>{it("keeps each role on its scoped detail route",()=>{
 const links=contactRecordLinks({membershipId:"m1",roles:["FACULTY","LEARNER"]});
 expect(links).toEqual([{label:"Student details",href:"/college/students/m1"},{label:"Faculty details",href:"/college/faculty/m1"}]);
});});