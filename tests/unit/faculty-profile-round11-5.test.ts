import {it,expect} from "vitest";
import {facultyProfileCanReorderVisible} from "@/modules/people/faculty-profile-search-controls";
it("requires all Skills visible before changing ordinal order",()=>{
 expect(facultyProfileCanReorderVisible(100,20)).toBe(false);
 expect(facultyProfileCanReorderVisible(100,100)).toBe(true);
});
