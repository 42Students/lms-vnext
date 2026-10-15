import {it,expect} from "vitest";
import {facultyResponseFollowUpQuerySchema,selectPastDueAssessments} from "@/modules/courses/faculty-response-followup-model";
const a="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("supports deterministic oldest-due sorting for overdue work",()=>{
 const rows=[{id:"b",deliveryId:a,kind:"QUIZ" as const,status:"PUBLISHED",title:"B",courseName:"C",sectionName:"S",dueAt:new Date("2026-10-08")},{id:"a",deliveryId:a,kind:"QUIZ" as const,status:"PUBLISHED",title:"A",courseName:"C",sectionName:"S",dueAt:new Date("2026-10-01")}];
 const q=facultyResponseFollowUpQuerySchema.parse({sort:"OLDEST_DUE"});
 expect(selectPastDueAssessments(rows,q,new Date("2026-10-15")).map(x=>x.id)).toEqual(["a","b"]);
 expect(selectPastDueAssessments(rows,{...q,sort:"RECENT_DUE"},new Date("2026-10-15")).map(x=>x.id)).toEqual(["b","a"]);
});
