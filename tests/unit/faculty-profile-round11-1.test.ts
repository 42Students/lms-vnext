import {it,expect} from "vitest";
import {facultyProfileActiveSearch} from "@/modules/people/faculty-profile-search-controls";
it("does not hide all profile records after collection shrinks below search threshold",()=>{
 expect(facultyProfileActiveSearch("biotech",6)).toBe("biotech");
 expect(facultyProfileActiveSearch("biotech",5)).toBe("");
 expect(facultyProfileActiveSearch("biotech",0)).toBe("");
});
