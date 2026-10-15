import {it,expect} from "vitest";
import {facultyResponseFollowUpQuerySchema,facultyResponseFollowUpPage,facultyResponseFollowUpHref} from "@/modules/courses/faculty-response-followup-model";
it("bounds missing-response expansion to at most ten assessments and persists pagination",()=>{
 const q=facultyResponseFollowUpQuerySchema.parse({pageSize:"10",sort:"TITLE"});
 expect(facultyResponseFollowUpHref(q)).toContain("pageSize=10");
 expect(facultyResponseFollowUpPage(Array.from({length:16},(_,i)=>i),1,q.pageSize).items).toHaveLength(10);
 expect(facultyResponseFollowUpPage(Array.from({length:16},(_,i)=>i),2,q.pageSize).items).toHaveLength(6);
 expect(facultyResponseFollowUpQuerySchema.safeParse({pageSize:"50"}).success).toBe(false);
 expect(()=>facultyResponseFollowUpPage([],1,50)).toThrow();
});
