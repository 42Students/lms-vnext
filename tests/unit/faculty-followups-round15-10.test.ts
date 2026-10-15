import {it,expect} from "vitest";
import {facultyResponseFollowUpQuerySchema,selectPastDueAssessments,facultyResponseFollowUpHref} from "@/modules/courses/faculty-response-followup-model";
const a="317458a6-9f8b-4f48-862b-91a270e12bb1",b="317458a6-9f8b-4f48-862b-91a270e12bb2";
it("limits follow-up list to the requested persisted Section",()=>{
 const rows=[a,b].map(deliveryId=>({id:deliveryId,deliveryId,kind:"QUIZ" as const,status:"PUBLISHED",title:"Q",courseName:"C",sectionName:"S",dueAt:new Date("2026-10-01")}));
 const q=facultyResponseFollowUpQuerySchema.parse({deliveryId:a});
 expect(selectPastDueAssessments(rows,q,new Date("2026-10-15"))).toHaveLength(1);
 expect(facultyResponseFollowUpHref(q)).toContain("deliveryId="+a);
});
