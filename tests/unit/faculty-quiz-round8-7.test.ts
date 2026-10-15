import {it,expect} from "vitest";
import {facultyQuizApplyPastedOptions} from "@/modules/courses/faculty-quiz-builder-model";
const blank=[{text:"",correct:true,sequence:0},{text:"",correct:false,sequence:1}];
it("accepts spreadsheet trailing newline but rejects interior blank options",()=>{
 const valid=facultyQuizApplyPastedOptions(blank," Alpha \r\nBeta\n");
 expect(valid.ok).toBe(true);
 if(valid.ok)expect(valid.options.map(q=>q.text)).toEqual(["Alpha","Beta"]);
 expect(facultyQuizApplyPastedOptions(blank,"Alpha\n\nBeta").ok).toBe(false);
 expect(facultyQuizApplyPastedOptions(blank,"A".repeat(40001)).ok).toBe(false);
});
