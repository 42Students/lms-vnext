import {it,expect} from "vitest";
import {facultyProfileSearchAfterInsertion} from "@/modules/people/faculty-profile-search-controls";
it("reveals the newly added blank Metadata editor after a query",()=>{
 expect(facultyProfileSearchAfterInsertion("teaching")).toBe("");
});
