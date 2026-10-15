import {describe,it,expect} from "vitest";
import {collegeRoleDirectoryPageRange} from "@/modules/people/college-role-directory-model";
describe("College Faculty/Students result ranges",()=>{
 it("shows the correct second page",()=>expect(collegeRoleDirectoryPageRange(2,25,73)).toEqual({first:26,last:50}));
 it("bounds the final partial page",()=>expect(collegeRoleDirectoryPageRange(3,25,73)).toEqual({first:51,last:73}));
 it("reports no rows when no membership matches",()=>expect(collegeRoleDirectoryPageRange(1,25,0)).toEqual({first:0,last:0}));
});
