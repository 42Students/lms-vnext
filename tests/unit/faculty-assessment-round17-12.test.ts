import {expect,it} from "vitest";
import {facultyAssessmentArchiveReceiptMatches} from "@/modules/courses/faculty-assessment-editor-model";
it("requires exact archived identity and does not confuse archival with deletion",()=>{
 const row={id:"assessment-a",title:"Quiz A",status:"ARCHIVED",updatedAt:"2026-10-15T15:00:00.000Z"};
 expect(facultyAssessmentArchiveReceiptMatches("QUIZ","assessment-a","Quiz A",{quiz:row})).toBe(true);
 expect(facultyAssessmentArchiveReceiptMatches("ASSIGNMENT","assessment-a","Quiz A",{assignment:row})).toBe(true);
 expect(facultyAssessmentArchiveReceiptMatches("QUIZ","assessment-b","Quiz A",{quiz:row})).toBe(false);
 expect(facultyAssessmentArchiveReceiptMatches("QUIZ","assessment-a","Quiz A",{quiz:{...row,status:"PUBLISHED"}})).toBe(false);
 expect(facultyAssessmentArchiveReceiptMatches("QUIZ","assessment-a","Quiz A",null)).toBe(false);
});
