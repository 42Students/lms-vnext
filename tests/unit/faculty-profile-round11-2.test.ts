import {it,expect} from "vitest";
import {facultyProfileActiveSearch} from "@/modules/people/faculty-profile-search-controls";
it("keeps Skills visible when the hidden search control has a stale query",()=>{
 expect(facultyProfileActiveSearch("Java",7)).toBe("Java");
 expect(facultyProfileActiveSearch("Java",4)).toBe("");
});
