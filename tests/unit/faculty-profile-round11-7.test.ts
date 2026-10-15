import {it,expect} from "vitest";
import {facultyProfileActiveSearch,facultyProfileSearchAfterInsertion} from "@/modules/people/faculty-profile-search-controls";
it("does not keep a new empty Skill filtered away",()=>{
 const query=facultyProfileSearchAfterInsertion("Java");
 expect(facultyProfileActiveSearch(query,8)).toBe("");
});
