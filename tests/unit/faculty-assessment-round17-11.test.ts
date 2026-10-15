import {expect,it} from "vitest";
import {facultyAssessmentEditReceiptMatches} from "@/modules/courses/faculty-assessment-editor-model";
it("requires the expected assessment identity, state and saved title",()=>{
 const row={id:"a",title:"Unit 1",status:"DRAFT",updatedAt:"2026-10-15T12:00:00.000Z"};
 expect(facultyAssessmentEditReceiptMatches("QUIZ","a","DRAFT","Unit 1",{quiz:row})).toBe(true);
 expect(facultyAssessmentEditReceiptMatches("ASSIGNMENT","a","DRAFT","Unit 1",{assignment:row})).toBe(true);
 expect(facultyAssessmentEditReceiptMatches("QUIZ","other","DRAFT","Unit 1",{quiz:row})).toBe(false);
 expect(facultyAssessmentEditReceiptMatches("QUIZ","a","PUBLISHED","Unit 1",{quiz:row})).toBe(false);
 expect(facultyAssessmentEditReceiptMatches("QUIZ","a","DRAFT","Unit 1",{quiz:{...row,title:"Old"}})).toBe(false);
 expect(facultyAssessmentEditReceiptMatches("QUIZ","a","DRAFT","Unit 1",{})).toBe(false);
});
