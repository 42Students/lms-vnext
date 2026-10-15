import {expect,it} from "vitest";
import {facultyQuizAttemptsQuerySchema} from "@/modules/courses/faculty-quiz-attempts-model";
const quizId="00000000-0000-4000-8000-000000000001";
const deliveryId="00000000-0000-4000-8000-000000000002";
it("accepts canonical pagination but rejects arrays, exponents and zero",()=>{
 const base={quizId,deliveryId};
 expect(facultyQuizAttemptsQuerySchema.parse({...base,page:"10000"}).page).toBe(10000);
 for(const page of ["0","01","+1","1e3","1.5","10001",["1","2"],"",Infinity]){
  expect(facultyQuizAttemptsQuerySchema.safeParse({...base,page}).success).toBe(false);
 }
});