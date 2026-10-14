import { describe, expect, it } from "vitest";
import { parseFacultySubmissionReviewUrl, facultySubmissionReviewApiHref, facultySubmissionListPage, selectFacultyAssignmentSubmissions } from "@/modules/courses/faculty-assignment-submissions-model";
import { facultySubmissionReviewResponse, facultySubmissionReviewResponseSchema } from "@/modules/courses/faculty-submission-review-model";
const id="10000000-0000-4000-8000-000000000001";
const row={id,assignmentId:id,deliveryId:id,membershipId:id,submissionType:"TEXT" as const,textContent:"Response",submissionUrl:null,submittedAt:new Date("2026-10-15T04:00:00Z"),pointsAwarded:null,feedback:null,gradingStatus:"NOT_GRADED" as const,gradePublished:false,version:0,learnerDisplayName:"Asha",learnerEmail:null};
describe("Faculty bounded grading review", () => {
 it("converts dates and emits only grade fields with at most twenty rows", () => {
  const response=facultySubmissionReviewResponse(facultySubmissionListPage([{...row,objectKey:"private/hidden"}],1));
  expect(response.items[0]?.submittedAt).toBe("2026-10-15T04:00:00.000Z");
  expect(response.items[0]).not.toHaveProperty("objectKey");
  expect(()=>facultySubmissionReviewResponse({...response,items:Array.from({length:21},()=>row)})).toThrow();
  expect(facultySubmissionReviewResponseSchema.safeParse({...response,page:2}).success).toBe(false);
 });
 it("rejects duplicate/forged selectors and preserves the canonical scoped API path", () => {
  const url="https://lms.example.test/review?assignmentId="+id;
  expect(parseFacultySubmissionReviewUrl(url+"&filter=UNGRADED&page=2",id)).toMatchObject({filter:"UNGRADED",page:2});
  for(const suffix of ["&assignmentId="+id,"&filter=ALL&filter=ALL","&collegeId="+id,"&deliveryId="+id,"&page=0"])
   expect(()=>parseFacultySubmissionReviewUrl(url+suffix,id)).toThrow();
  expect(facultySubmissionReviewApiHref({assignmentId:id,deliveryId:id,filter:"GRADED",page:2})).toContain("/"+id+"/submissions?assignmentId="+id+"&filter=GRADED&page=2");
 });
 it("sorts equal-time submissions deterministically before paging", () => {
  const rows=[{...row,id:"b"},{...row,id:"a"}];
  expect(selectFacultyAssignmentSubmissions(rows,"ALL",null).map(item=>item.id)).toEqual(["a","b"]);
 });
});
