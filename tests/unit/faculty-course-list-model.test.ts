import { describe, expect, it } from "vitest";
import {CoursesServiceError} from "@/modules/courses/errors";
import { facultyCourseListQuerySchema, pageFacultyCourseList, facultyCourseListHref,facultyCourseWorkspaceRevokedError } from "@/modules/courses/faculty-course-list-model";
const period="10000000-0000-4000-8000-000000000001";
const rows=Array.from({length:75},(_,i)=>({courseName:"Java "+i,courseCode:"JAVA",sectionName:"Section "+i,sectionCode:"A",academicPeriodId:period,academicPeriodName:"Term 1",teachingRole:i%2?"TA":"PRIMARY"}));
describe("Faculty Course list query and bounded cards", () => {
 it("drops only concurrently revoked cards without swallowing genuine failures",()=>{
  for(const code of ["FACULTY_TEACHING_SCOPE_REQUIRED","SECTION_DELIVERY_NOT_FOUND",
    "OFFERING_NOT_FOUND","LEARNING_ACCESS_DENIED"] as const){
    expect(facultyCourseWorkspaceRevokedError(new CoursesServiceError(code))).toBe(true);
  }
  expect(facultyCourseWorkspaceRevokedError(new Error("Database timeout"))).toBe(false);
 });
 it("pages before loading workspaces and clamps stale out-of-range pages", () => {
  const first=pageFacultyCourseList(rows,facultyCourseListQuerySchema.parse({}));
  expect(first.items).toHaveLength(48); expect(first.total).toBe(75);
  const last=pageFacultyCourseList(rows,facultyCourseListQuerySchema.parse({page:999}));
  expect(last.page).toBe(2); expect(last.items).toHaveLength(27);
  expect(rows).toHaveLength(75);
 });
 it("intersects literal search, period and role within authorized rows", () => {
  expect(pageFacultyCourseList(rows,facultyCourseListQuerySchema.parse({q:" java ",period,role:"TA"})).total).toBe(37);
  expect(pageFacultyCourseList(rows,facultyCourseListQuerySchema.parse({q:"%"})).total).toBe(0);
  expect(pageFacultyCourseList(rows,facultyCourseListQuerySchema.parse({q:"Section 74"})).items).toEqual([rows[74]]);
  expect(pageFacultyCourseList([],facultyCourseListQuerySchema.parse({page:2}))).toMatchObject({page:1,total:0,totalPages:1});
 });
 it("rejects forged, duplicated and invalid selectors and preserves filters in links", () => {
  for(const query of [{q:["a","b"]},{page:["2"]},{page:true},{page:"1e3"},{page:"02"},{period:"bad"},{role:"ADMIN"},{page:0},{page:"1.5"},{collegeId:period},{q:"x".repeat(121)}])
   expect(facultyCourseListQuerySchema.safeParse(query).success).toBe(false);
  expect(facultyCourseListHref({q:" Java & UI ",period,role:"TA",page:2})).toBe("/teacher/courses?q=Java+%26+UI&period="+period+"&role=TA&page=2");
  expect(facultyCourseListHref({})).toBe("/teacher/courses");
  expect(facultyCourseListQuerySchema.parse({page:"10000"}).page).toBe(10000);
 });
});
