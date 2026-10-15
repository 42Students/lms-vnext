import {describe,it,expect} from "vitest";
import {collegeContactsPageRange} from "@/modules/people/college-contacts-model";
describe("College Contacts page ordinals",()=>{
 it("numbers full pages exactly",()=>{expect(collegeContactsPageRange(2,25,80)).toEqual({first:26,last:50});});
 it("bounds a partial final page",()=>{expect(collegeContactsPageRange(4,25,80)).toEqual({first:76,last:80});});
 it("never presents a fictitious first row for an empty result",()=>{expect(collegeContactsPageRange(1,25,0)).toEqual({first:0,last:0});});
});
