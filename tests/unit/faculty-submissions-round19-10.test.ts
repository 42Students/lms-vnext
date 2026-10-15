import {expect,it} from "vitest";
import {facultySubmissionCsvScopeNote} from "@/modules/courses/faculty-assignment-submissions-model";
it("never claims page-only search, grade privacy or sorting filters affect server export",()=>{
 const base={q:"",publication:"ALL" as const,order:"NEWEST" as const};
 expect(facultySubmissionCsvScopeNote(base)).toContain("not just this page");
 expect(facultySubmissionCsvScopeNote({...base,q:"Jane"})).toContain("page only");
 expect(facultySubmissionCsvScopeNote({...base,publication:"PRIVATE"})).toContain("page only");
 expect(facultySubmissionCsvScopeNote({...base,order:"OLDEST"})).toContain("page only");
});