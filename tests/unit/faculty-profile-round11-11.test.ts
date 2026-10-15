import {it,expect} from "vitest";
import {facultyProfileSearchSummary} from "@/modules/people/faculty-profile-search-controls";
it("shows filtered Metadata totals without fabricating missing rows",()=>{
 expect(facultyProfileSearchSummary(6,0)).toBe("Showing 0 of 6 records");
 expect(facultyProfileSearchSummary(6,6)).toBe("Showing 6 of 6 records");
});
