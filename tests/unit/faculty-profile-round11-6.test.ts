import {it,expect} from "vitest";
import {facultyProfileSearchAfterInsertion} from "@/modules/people/faculty-profile-search-controls";
it("makes new Faculty entries immediately visible after filtered insertion",()=>{
 expect(facultyProfileSearchAfterInsertion("specialization")).toBe("");
 expect(facultyProfileSearchAfterInsertion("")).toBe("");
});
