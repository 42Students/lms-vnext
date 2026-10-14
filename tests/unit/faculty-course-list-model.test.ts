import { describe, expect, it } from "vitest";
import { facultyCourseListQuerySchema, pageFacultyCourseList, facultyCourseListHref } from "@/modules/courses/faculty-course-list-model";
const period="10000000-0000-4000-8000-000000000001";
const rows=Array.from({length:75},(_,i)=>({courseName:"Java "+i,courseCode:"JAVA",sectionName:"Section "+i,sectionCode:"A",academicPeriodId:period,academicPeriodName:"Term 1",teachingRole:i%2?"TA":"PRIMARY"}));
describe("Faculty Course list query and bounded cards", () => {
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
  for(const query of [{q:["a","b"]},{period:"bad"},{role:"ADMIN"},{page:0},{page:"1.5"},{collegeId:period},{q:"x".repeat(121)}])
   expect(facultyCourseListQuerySchema.safeParse(query).success).toBe(false);
  expect(facultyCourseListHref({q:" Java & UI ",period,role:"TA",page:2})).toBe("/teacher/courses?q=Java+%26+UI&period="+period+"&role=TA&page=2");
  expect(facultyCourseListHref({})).toBe("/teacher/courses");
 });
});
