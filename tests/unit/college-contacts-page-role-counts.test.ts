import {describe,it,expect} from "vitest";
import {collegeContactPageRoleCounts} from "@/modules/people/college-contacts-model";
describe("Contact page-local role breakdown",()=>{
 it("never double counts a dual-role person as two contacts",()=>{expect(collegeContactPageRoleCounts([{roles:["FACULTY","LEARNER"]},{roles:["FACULTY"]},{roles:["LEARNER"]}])).toEqual({facultyOnly:1,learnerOnly:1,dual:1});});
 it("reports an empty result honestly",()=>{expect(collegeContactPageRoleCounts([])).toEqual({facultyOnly:0,learnerOnly:0,dual:0});});
});
