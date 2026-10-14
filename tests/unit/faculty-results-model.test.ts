import { describe, expect, it } from "vitest";
import {
  facultyResultsHref,
  facultyResultsQuerySchema,
  filterFacultyResultCandidates,
  paginateFacultyResults,
  facultyRecordedResponseRate,
  type FacultyResultCandidate,
} from "@/modules/courses/faculty-results-model";

const d = "00000000-0000-4000-8000-000000000001";
const d2 = "00000000-0000-4000-8000-000000000002";
const rows: FacultyResultCandidate[] = [
  {id:"a",kind:"ASSIGNMENT",title:"Project A",courseName:"Java",
    sectionName:"A",deliveryId:d,status:"PUBLISHED",dueAt:new Date("2026-10-13T10:00:00Z")},
  {id:"b",kind:"QUIZ",title:"Module B",courseName:"Java",
    sectionName:"B",deliveryId:d2,status:"DRAFT",dueAt:null},
];

describe("Faculty assessment results model",() => {
  it("separates assessment kinds and published state from actual learner scores",() => {
    expect(filterFacultyResultCandidates(rows,{kind:"QUIZ",status:"ALL",search:""}).map(x=>x.id))
      .toEqual(["b"]);
    expect(filterFacultyResultCandidates(rows,{kind:"ALL",status:"PUBLISHED",search:""}).map(x=>x.id))
      .toEqual(["a"]);
    expect(filterFacultyResultCandidates(rows,{kind:"ALL",status:"ALL",search:"java"})).toHaveLength(2);
    expect(filterFacultyResultCandidates(rows,{kind:"ALL",status:"ALL",search:"",deliveryId:d}).map(x=>x.id)).toEqual(["a"]);
    expect(filterFacultyResultCandidates(rows,{kind:"ALL",status:"ALL",search:"",deliveryId:d2}).map(x=>x.id)).toEqual(["b"]);
    expect(filterFacultyResultCandidates(rows,{kind:"ALL",status:"ALL",search:"nonexistent"})).toEqual([]);
  });
  it("includes closed quizzes in published result reports but excludes draft",()=>{
    const closed={...rows[1]!,status:"CLOSED"};
    expect(filterFacultyResultCandidates([...rows,closed],{
      kind:"QUIZ",status:"PUBLISHED",search:"",
    }).map(x=>x.id)).toEqual(["b"]);
    expect(filterFacultyResultCandidates(rows,{
      kind:"QUIZ",status:"PUBLISHED",search:"",
    })).toEqual([]);
  });
  it("bounds summary batch work and clamps stale page numbers",() => {
    expect(paginateFacultyResults(rows,999,1)).toMatchObject({
      total:2,totalPages:2,page:2,items:[rows[1]],
    });
    expect(paginateFacultyResults([],6)).toMatchObject({
      total:0,totalPages:1,page:1,items:[],
    });
  });
  it("separates zero recorded responses from no eligible learners or invalid totals",() => {
    expect(facultyRecordedResponseRate(10,0)).toBe(0);
    expect(facultyRecordedResponseRate(10,4)).toBe(40);
    expect(facultyRecordedResponseRate(3,3)).toBe(100);
    expect(facultyRecordedResponseRate(0,0)).toBeNull();
    expect(facultyRecordedResponseRate(2,3)).toBeNull();
    expect(facultyRecordedResponseRate(4,-1)).toBeNull();
  });
  it("strictly rejects tenant selectors and invalid query settings",() => {
    expect(facultyResultsQuerySchema.safeParse({collegeId:d}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({deliveryId:"not-a-uuid"}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({page:"0"}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({status:"GRADED"}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({kind:"OTHER"}).success).toBe(false);
    expect(facultyResultsQuerySchema.safeParse({search:"X".repeat(121)}).success).toBe(false);
  });
  it("encodes only filter/navigation fields",() => {
    expect(facultyResultsHref({kind:"QUIZ",status:"PUBLISHED",search:"Java & Web",page:2}))
      .toBe("/teacher/results?kind=QUIZ&status=PUBLISHED&search=Java+%26+Web&page=2");
    expect(facultyResultsHref({kind:"QUIZ",status:"ALL",deliveryId:d2,search:"",page:3}))
      .toBe("/teacher/results?kind=QUIZ&deliveryId="+d2+"&page=3");
  });
});
