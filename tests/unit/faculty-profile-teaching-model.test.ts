import { describe, expect, it } from "vitest";
import {
  facultyProfileTeachingQuerySchema, ownFacultyTeachingHref,
  pageOwnFacultyTeaching, type FacultyTeachingRecord,
} from "@/modules/courses/faculty-profile-teaching-model";

const rows: FacultyTeachingRecord[]=[
  {deliveryId:"d1",courseCode:"CS101",courseName:"Java",sectionName:"A",
    academicPeriodName:"Autumn 2026",academicPeriodStatus:"ACTIVE",teachingRole:"PRIMARY"},
  {deliveryId:"d2",courseCode:"CS102",courseName:"Databases",sectionName:"B",
    academicPeriodName:"Spring 2027",academicPeriodStatus:"ACTIVE",teachingRole:"ASSISTANT"},
];
describe("Faculty self-profile teaching records",()=>{
  it("shows only passed authorized records, preserving college assignment facts",()=>{
    expect(pageOwnFacultyTeaching(rows,{search:"java",page:1}).items.map(x=>x.deliveryId))
      .toEqual(["d1"]);
    expect(pageOwnFacultyTeaching(rows,{search:"spring",page:1}).items.map(x=>x.deliveryId))
      .toEqual(["d2"]);
    expect(pageOwnFacultyTeaching(rows,{search:"",page:1}).total).toBe(2);
  });
  it("keeps empty profile state honest and clamps a stale page",()=>{
    expect(pageOwnFacultyTeaching([],{search:"",page:99}))
      .toEqual({total:0,page:1,pageSize:20,totalPages:1,items:[]});
    expect(pageOwnFacultyTeaching(rows,{search:"",page:999})).toMatchObject({page:1,totalPages:1});
  });
  it("refuses caller tenant selectors, bad paging and oversized search",()=>{
    expect(facultyProfileTeachingQuerySchema.safeParse({collegeId:"external"}).success).toBe(false);
    expect(facultyProfileTeachingQuerySchema.safeParse({membershipId:"external"}).success).toBe(false);
    expect(facultyProfileTeachingQuerySchema.safeParse({page:0}).success).toBe(false);
    expect(facultyProfileTeachingQuerySchema.safeParse({search:"X".repeat(121)}).success).toBe(false);
  });
  it("constructs only bounded filter and pagination links",()=>{
    expect(ownFacultyTeachingHref({search:"C++ & Java",page:2}))
      .toBe("/teacher/profile/teaching?search=C%2B%2B+%26+Java&page=2");
  });
});
