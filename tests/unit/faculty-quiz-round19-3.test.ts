import {expect,it} from "vitest";
import {facultySearchQuizAttempts,facultyQuizAttemptsHref,facultyQuizAttemptsQuerySchema} from "@/modules/courses/faculty-quiz-attempts-model";
const ids={quizId:"00000000-0000-4000-8000-000000000001",deliveryId:"00000000-0000-4000-8000-000000000002"};
it("filters authorized learner labels without inferring another Section",()=>{
 const rows=[{learnerDisplayName:"Akhil",learnerEmail:null},{learnerDisplayName:"Priya",learnerEmail:"p@example.test"}];
 expect(facultySearchQuizAttempts(rows," AKH ")).toHaveLength(1);
 expect(facultySearchQuizAttempts(rows,"no match")).toHaveLength(0);
 expect(facultyQuizAttemptsQuerySchema.parse({...ids,q:"  Akh "}).q).toBe("Akh");
 expect(facultyQuizAttemptsQuerySchema.safeParse({...ids,q:"x".repeat(121)}).success).toBe(false);
 expect(facultyQuizAttemptsHref(ids.quizId,ids.deliveryId,2,"OLDEST","Akh")).toContain("q=Akh");
});