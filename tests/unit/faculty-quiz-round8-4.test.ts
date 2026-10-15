import {it,expect} from "vitest";
import {facultyQuizTitleConflict} from "@/modules/courses/faculty-quiz-builder-model";
it("flags duplicate titles in the current Section but permits the current Quiz",()=>{
 const rows=[{id:"a",title:"  Calculus Quiz  "},{id:"b",title:"Physics"}];
 expect(facultyQuizTitleConflict(rows,"calculus quiz",undefined)).toBe(true);
 expect(facultyQuizTitleConflict(rows,"CALCULUS QUIZ","a")).toBe(false);
 expect(facultyQuizTitleConflict(rows,"Different",undefined)).toBe(false);
});
