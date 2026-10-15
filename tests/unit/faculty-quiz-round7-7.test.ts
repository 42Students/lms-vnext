import {it,expect} from "vitest";
import {facultyInsertQuizOptionAfter} from "@/modules/courses/faculty-quiz-builder-model";
it("inserts an unchecked answer immediately after the chosen option",()=>{
 const before=[{text:"A",correct:true},{text:"C",correct:false}];
 const after=facultyInsertQuizOptionAfter(before,0,{text:"B",correct:false});
 expect(after.map(x=>x.text)).toEqual(["A","B","C"]);
 expect(before.map(x=>x.text)).toEqual(["A","C"]);
 expect(after[0]?.correct).toBe(true);
});
it("does not exceed option cap or accept invalid insert locations",()=>{
 expect(facultyInsertQuizOptionAfter(Array(20).fill("a"),0,"b")).toHaveLength(20);
 expect(facultyInsertQuizOptionAfter(["a"],3,"b")).toEqual(["a"]);
});