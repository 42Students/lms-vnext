import {it,expect} from "vitest";
import {facultyTeachingSelectionAllowed} from "@/modules/courses/faculty-teaching-selector";
const a="317458a6-9f8b-4f48-862b-91a270e12bb1",b="317458a6-9f8b-4f48-862b-91a270e12bb2";
it("refuses foreign teaching Section selectors for summary reports",()=>{
 expect(facultyTeachingSelectionAllowed([{deliveryId:a}],a)).toBe(true);
 expect(facultyTeachingSelectionAllowed([{deliveryId:a}],b)).toBe(false);
 expect(facultyTeachingSelectionAllowed([],b)).toBe(false);
 expect(facultyTeachingSelectionAllowed([],undefined)).toBe(true);
});
