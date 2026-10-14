import {describe,expect,it} from "vitest";
import {
  facultySubmissionListPage,facultySubmissionListQuerySchema,
  selectFacultyAssignmentSubmissions,facultySubmissionListHref,
} from "@/modules/courses/faculty-assignment-submissions-model";
const id="00000000-0000-4000-8000-000000000001";
const due=new Date("2026-10-13T12:00:00Z");
const rows=[
  {id:"a",gradingStatus:"GRADED",submittedAt:new Date("2026-10-13T11:00:00Z")},
  {id:"b",gradingStatus:"PENDING",submittedAt:new Date("2026-10-13T13:00:00Z")},
  {id:"c",gradingStatus:"GRADED",submittedAt:new Date("2026-10-13T14:00:00Z")},
];
describe("Faculty assignment Section submission filters",()=>{
  it("separates graded, ungraded, and real late submission timestamps",()=>{
    expect(selectFacultyAssignmentSubmissions(rows,"GRADED",due).map(x=>x.id))
      .toEqual(["c","a"]);
    expect(selectFacultyAssignmentSubmissions(rows,"UNGRADED",due).map(x=>x.id))
      .toEqual(["b"]);
    expect(selectFacultyAssignmentSubmissions(rows,"LATE",due).map(x=>x.id))
      .toEqual(["c","b"]);
    expect(selectFacultyAssignmentSubmissions(rows,"LATE",null)).toEqual([]);
  });
  it("clamps expired pages and strict scope selectors",()=>{
    expect(facultySubmissionListPage([],30)).toMatchObject({
      total:0,page:1,totalPages:1,items:[],
    });
    expect(facultySubmissionListQuerySchema.safeParse({
      assignmentId:id,deliveryId:id,collegeId:id,
    }).success).toBe(false);
    expect(facultySubmissionListQuerySchema.safeParse({
      assignmentId:id,deliveryId:id,filter:"DELETED",
    }).success).toBe(false);
    expect(facultySubmissionListHref({
      assignmentId:id,deliveryId:id,filter:"LATE",page:2,
    })).toContain("/submissions?deliveryId="+id+"&filter=LATE&page=2");
  });
});
