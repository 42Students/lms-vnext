import {it,expect} from "vitest";
import {facultyProfileActiveSearch} from "@/modules/people/faculty-profile-search-controls";
it("never applies invisible Metadata search below the threshold",()=>{
 expect(facultyProfileActiveSearch("award",100)).toBe("award");
 expect(facultyProfileActiveSearch("award",5)).toBe("");
});
