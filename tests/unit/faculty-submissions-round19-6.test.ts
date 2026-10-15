import {expect,it} from "vitest";
import {facultySortSubmissionReportRows,facultySubmissionListHref,facultySubmissionReportPageQuerySchema} from "@/modules/courses/faculty-assignment-submissions-model";
const ids={assignmentId:"00000000-0000-4000-8000-000000000001",deliveryId:"00000000-0000-4000-8000-000000000002"};
it("orders without mutating the authorized submissions, preserving page filters",()=>{
 const rows=[{id:"old",submittedAt:new Date("2026-10-14T00:00:00Z")},{id:"new",submittedAt:new Date("2026-10-15T00:00:00Z")}];
 expect(facultySortSubmissionReportRows(rows,"OLDEST")[0]?.id).toBe("old");
 expect(facultySortSubmissionReportRows(rows,"NEWEST")[0]?.id).toBe("new");
 expect(rows[0]?.id).toBe("old");
 const q=facultySubmissionReportPageQuerySchema.parse({...ids,order:"OLDEST"});
 expect(facultySubmissionListHref(q)).toContain("order=OLDEST");
});