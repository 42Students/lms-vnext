import {it,expect} from "vitest";
import {facultyTeachingSelectionAllowed} from "@/modules/courses/faculty-teaching-selector";
it("denies forged Section filters for overdue follow-ups without disclosing other rosters",()=>{
 const current=[{deliveryId:"current-faculty-section"}];
 expect(facultyTeachingSelectionAllowed(current,"current-faculty-section")).toBe(true);
 expect(facultyTeachingSelectionAllowed(current,"foreign-section")).toBe(false);
});
