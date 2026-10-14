import {describe,it,expect} from "vitest";
import {facultyQuizQuestionAccuracyCsv} from "@/modules/courses/faculty-quiz-question-csv";
describe("Faculty question accuracy CSV privacy and caps",()=>{
 it("serializes question aggregates but no learner identities, with formula neutralization",()=>{
  const a=facultyQuizQuestionAccuracyCsv([{
   prompt:"=IMPORTXML(1,2)",points:5,answeredCount:2,correctCount:1,accuracyPercent:50,
  }]);
  expect(a.csv).toContain('"Question","Points","Answered","Correct","Accuracy (%)"');
  expect(a.csv).toContain('"\'=IMPORTXML(1,2)","5","2","1","50"');
  expect(a.csv).not.toContain("@example.");
  expect(a.omittedRows).toBe(0);
 });
 it("marks unattempted question accuracy unknown, never 0%",()=>{
  const a=facultyQuizQuestionAccuracyCsv([{
   prompt:"Unanswered?",points:2,answeredCount:0,correctCount:0,accuracyPercent:null,
  }]);
  expect(a.csv).toContain('"Unanswered?","2","0","0",""');
 });
 it("caps 501 questions, gives a numeric notice and does not serialize tail",()=>{
  const rows=Array.from({length:501},(_,i)=>({
   prompt:i===500?"PRIVATE-TAIL-NOT-IN-EXPORT":"Question "+i,
   points:1,answeredCount:1,correctCount:1,accuracyPercent:100,
  }));
  const a=facultyQuizQuestionAccuracyCsv(rows);
  expect(a.omittedRows).toBe(1);
  expect(a.csv).not.toContain("PRIVATE-TAIL-NOT-IN-EXPORT");
  expect(a.csv).toContain("1 more questions omitted");
  expect(a.csv.split("\r\n").filter(Boolean)).toHaveLength(502);
 });
});
