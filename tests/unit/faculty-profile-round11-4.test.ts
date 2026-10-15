import {it,expect} from "vitest";
import {facultyProfileCanReorderVisible} from "@/modules/people/faculty-profile-search-controls";
it("allows reordering only while the full sequence is visible",()=>{
 expect(facultyProfileCanReorderVisible(6,6)).toBe(true);
 expect(facultyProfileCanReorderVisible(6,2)).toBe(false);
 expect(facultyProfileCanReorderVisible(0,0)).toBe(true);
});
