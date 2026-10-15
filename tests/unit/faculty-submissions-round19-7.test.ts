import {expect,it} from "vitest";
import {facultySearchSubmissionReportRows,facultySubmissionReportPageQuerySchema,facultySubmissionListHref} from "@/modules/courses/faculty-assignment-submissions-model";
const ids={assignmentId:"00000000-0000-4000-8000-000000000001",deliveryId:"00000000-0000-4000-8000-000000000002"};
it("filters only already scoped names with bounded query and canonical links",()=>{
 const rows=[{learnerDisplayName:"Akhil"},{learnerDisplayName:"Priya"},{learnerDisplayName:null}];
 expect(facultySearchSubmissionReportRows(rows,"AKH")).toHaveLength(1);
 expect(facultySearchSubmissionReportRows(rows,"")).toHaveLength(3);
 expect(facultySubmissionReportPageQuerySchema.safeParse({...ids,q:"x".repeat(121)}).success).toBe(false);
 const q=facultySubmissionReportPageQuerySchema.parse({...ids,q:" Priya "});
 expect(facultySubmissionListHref(q)).toContain("q=Priya");
});