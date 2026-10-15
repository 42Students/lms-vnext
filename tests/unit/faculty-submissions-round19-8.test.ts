import {expect,it} from "vitest";
import {facultyFilterSubmissionPublication,facultySubmissionListHref,facultySubmissionReportPageQuerySchema} from "@/modules/courses/faculty-assignment-submissions-model";
const assignmentId="00000000-0000-4000-8000-000000000001",deliveryId="00000000-0000-4000-8000-000000000002";
it("distinguishes recorded published grades from private or ungraded submissions",()=>{
 const rows=[{gradePublished:true},{gradePublished:false}];
 expect(facultyFilterSubmissionPublication(rows,"PUBLISHED")).toEqual([rows[0]]);
 expect(facultyFilterSubmissionPublication(rows,"PRIVATE")).toEqual([rows[1]]);
 expect(facultyFilterSubmissionPublication(rows,"ALL")).toEqual(rows);
 const q=facultySubmissionReportPageQuerySchema.parse({assignmentId,deliveryId,publication:"PRIVATE"});
 expect(facultySubmissionListHref(q)).toContain("publication=PRIVATE");
 expect(facultySubmissionReportPageQuerySchema.safeParse({assignmentId,deliveryId,publication:"FOREIGN"}).success).toBe(false);
});