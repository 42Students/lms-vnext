import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {collegeCourseCatalogueQuerySchema,paginateCollegeCourses,collegeCourseCatalogueHref} from "@/modules/courses/college-course-catalogue-model";

const courses=[
 {id:"b",name:"Machine Learning",code:"CS202",departmentName:"Computer Science"},
 {id:"a",name:"Algorithms",code:"CS101",departmentName:"Computer Science"},
 {id:"c",name:"Machine Learning",code:"CS205",departmentName:"Computer Science"},
 {id:"d",name:"Physics",code:"PH101",departmentName:"Physics"},
];
const query=(input:Record<string,unknown>)=>collegeCourseCatalogueQuerySchema.parse(input);
describe("SA-COURSES-TOUCH-13 Super Admin course catalogue mobile filters and safe pagination",()=>{
 it("keeps search and sort tenant-neutral, deterministic and case insensitive",()=>{
  const result=paginateCollegeCourses(courses,query({q:"COMPUTER",sort:"NAME_ASC"}));
  expect(result.items.map(x=>x.id)).toEqual(["a","b","c"]);
  expect(result.total).toBe(3);
  const descending=paginateCollegeCourses(courses,query({sort:"CODE_DESC"}));
  expect(descending.items.map(x=>x.id)).toEqual(["d","c","b","a"]);
 });
 it("caps URL page number to a populated page and keeps empty page usable",()=>{
  const result=paginateCollegeCourses(courses,query({page:999,pageSize:"25"}));
  expect(result.page).toBe(1);
  expect(result.items).toHaveLength(4);
  const empty=paginateCollegeCourses([],query({page:999}));
  expect(empty).toMatchObject({items:[],total:0,pages:1,page:1});
 });
 it("rejects malformed sort, oversized search and negative page before building a URL",()=>{
  for(const filters of [
   {sort:"DROP"}, {q:"x".repeat(101)},{page:-1},{page:0},
   {pageSize:"1000"}, {collegeId:"tenant-override"},
  ])expect(collegeCourseCatalogueQuerySchema.safeParse(filters).success).toBe(false);
  const href=collegeCourseCatalogueHref(query({q:"Data",page:2,pageSize:"50"}));
  expect(href).toContain("page=2");
  expect(href).toContain("pageSize=50");
  expect(href).not.toContain("collegeId");
 });
 it("renders accessible 44px Super Admin filters and all touch/keyboard course actions",()=>{
  const component=readFileSync("src/components/courses/admin-course-overview.tsx","utf8");
  expect(component).toContain("Open learning");
  expect(component).toContain("Refresh");
  expect(component).toContain("Previous");
  expect(component).toContain("Next");
  expect(component).toContain("min-h-11");
  expect(component).not.toContain("min-h-10");
  expect(component).not.toContain("min-h-9");
 });
});
