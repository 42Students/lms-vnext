import {it,expect} from "vitest";
import {facultyProfileSearchSummary} from "@/modules/people/faculty-profile-search-controls";
it("renders an honest count without altering the complete draft",()=>{
 expect(facultyProfileSearchSummary(30,4)).toBe("Showing 4 of 30 records");
 expect(facultyProfileSearchSummary(12,0)).toBe("Showing 0 of 12 records");
});
