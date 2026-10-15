import {expect,it} from "vitest";
import {facultySubmissionReportPageQuerySchema} from "@/modules/courses/faculty-assignment-submissions-model";
const ids={assignmentId:"00000000-0000-4000-8000-000000000001",deliveryId:"00000000-0000-4000-8000-000000000002"};
it("parses only a canonical report page without weakening the existing API",()=>{
 expect(facultySubmissionReportPageQuerySchema.parse({...ids,page:"10000"}).page).toBe(10000);
 for(const page of ["0","01","1e2","-1","10001","",["1","2"]]){
  expect(facultySubmissionReportPageQuerySchema.safeParse({...ids,page}).success).toBe(false);
 }
 expect(facultySubmissionReportPageQuerySchema.safeParse({...ids,collegeId:ids.deliveryId}).success).toBe(false);
});