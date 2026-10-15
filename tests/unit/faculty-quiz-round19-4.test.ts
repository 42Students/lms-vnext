import {expect,it} from "vitest";
import {facultyQuizAttemptsQuerySchema,facultyQuizAttemptsHref} from "@/modules/courses/faculty-quiz-attempts-model";
const quizId="00000000-0000-4000-8000-000000000001",deliveryId="00000000-0000-4000-8000-000000000002";
it("accepts only safe latest/all views and retains it across paging",()=>{
 expect(facultyQuizAttemptsQuerySchema.parse({quizId,deliveryId}).view).toBe("ALL");
 expect(facultyQuizAttemptsQuerySchema.parse({quizId,deliveryId,view:"LATEST"}).view).toBe("LATEST");
 expect(facultyQuizAttemptsQuerySchema.safeParse({quizId,deliveryId,view:"OTHER"}).success).toBe(false);
 expect(facultyQuizAttemptsHref(quizId,deliveryId,3,"OLDEST","Jane","LATEST")).toContain("view=LATEST");
});