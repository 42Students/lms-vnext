import {it,expect} from "vitest";
import {facultyProfileSearchSummary} from "@/modules/people/faculty-profile-search-controls";
it("labels partial Skills results for screen-reader review",()=>{
 expect(facultyProfileSearchSummary(100,1)).toContain("1 of 100");
});
