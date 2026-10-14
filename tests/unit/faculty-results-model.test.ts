import { describe, expect, it } from "vitest";
import {
  facultyResultsHref,
  facultyResultsQuerySchema,
  filterFacultyResultCandidates,
  paginateFacultyResults,
  type FacultyResultCandidate,
} from "@/modules/courses/faculty-results-model";

const d = "00000000-0000-4000-8000-000000000001";
const rows: FacultyResultCandidate[] = [
  {id:"a",kind:"ASSIGNMENT",title:"Project A",courseName:"Java",
    sectionName:"A",deliveryId:d,status:"PUBLISHED",dueAt:new Date("2026-10-13T10:00:00Z")},
  {id:"b",kind:"QUIZ",title:"Module B",courseName:"Java",
    sectionName:"B",deliveryId:d,status:"DRAFT",dueAt:null},
];

describe("Faculty assessment results model",() => {
  it("separates assessment kinds and published state from actual learner scores",() => {
    expect(filterFacultyResultCandidates(rows,{kind:"QUIZ",status:"ALL",search:""}).map(x=>x.id))
      .toEqual(["b"]);
    expect(filterFacultyResultCandidates(rows,{kind:"ALL",status:"PUBLISHED",search:""}).map(x=>x.id))
      .toEqual(["a"]);
    expect(filterFacultyResultCandidates(rows,{kind:"ALL",status:"ALL",search:"java"})).toHaveLength(2);
    expect(filterFacultyResultCandidates(rows,{kind:"ALL",status:"ALL",search:"nonexistent"})).toEqual([]);
  });
  it("bounds summary batch work and clamps stale page numbers",() => {
    expect(paginateFacultyResults(rows,999,1)).toMatchObject({
      total:2,totalPages:2,page:2,items:[rows[1]],
    });
    expect(paginateFacultyResults([],6)).toMatchObject({
      total:0,totalPages:1,page:1,items:[],
    });
  });
  it("strictly rejects tenant selectors and invalid query settings",() => {
    expect(facultyResultsQuerySchema.safeParse({collegeId:d}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({page:"0"}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({status:"GRADED"}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({kind:"OTHER"}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({search:"X".repeat(121)}).success).toBe(false);
  });
  it("encodes only filter/navigation fields",() => {
    expect(facultyResultsHref({kind:"QUIZ",status:"PUBLISHED",search:"Java & Web",page:2}))
      .toBe("/teacher/results?kind=QUIZ&status=PUBLISHED&search=Java+%26+Web&page=2");
  });
});
