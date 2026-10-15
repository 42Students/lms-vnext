import {expect,it} from "vitest";
import {facultyQuizAttemptsPage,facultyQuizAttemptsHref} from "@/modules/courses/faculty-quiz-attempts-model";
it("sorts attempts by persisted timestamp and preserves mode on navigation",()=>{
 const rows=[{id:"z",submittedAt:new Date("2026-10-15T10:00:00Z")},{id:"a",submittedAt:new Date("2026-10-14T10:00:00Z")}];
 expect(facultyQuizAttemptsPage(rows,1,"NEWEST").items[0]?.id).toBe("z");
 expect(facultyQuizAttemptsPage(rows,1,"OLDEST").items[0]?.id).toBe("a");
 expect(rows[0]?.id).toBe("z");
 expect(facultyQuizAttemptsHref("quiz","section",2,"OLDEST")).toContain("order=OLDEST");
});