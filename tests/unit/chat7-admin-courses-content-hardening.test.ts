import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {parseSuperAdminCourseQuery} from "@/modules/admin-ui/super-admin-course-query-model";
import {paginateCollegeCourses} from "@/modules/courses/college-course-catalogue-model";
import {effectiveCourseContentVisibleToStudents,adminContentQuerySchema,
  adminContentHref,contentTypesForKind} from "@/modules/courses/super-admin-content-directory-model";
import {safePublicCourseContentUrl} from "@/modules/courses/super-admin-content-public-link-model";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const courseId="11111111-1111-4111-8111-111111111111";

describe("SA-COURSES-CONTENT-AUDIT-02 course and resource list boundaries",()=>{
 it("denies array-smuggled search/page and invalid duplicate or tenant selectors",()=>{
   const parsed=parseSuperAdminCourseQuery({
     q:"  Team ",page:"2",sort:"CODE_ASC",pageSize:"50",duplicate:courseId,
   });
   expect(parsed).not.toBeNull();
   expect(parsed?.catalogueQuery).toMatchObject({
     q:"Team",page:2,sort:"CODE_ASC",pageSize:"50",
   });
   expect(parsed?.duplicateCourseId).toBe(courseId);
   for(const invalid of [
     {q:["a"]},{page:["1"]},{page:"-1"},{page:"1.5"},{page:"1001"},
     {page:"Infinity"},{sort:"random"},{pageSize:"500"},{duplicate:"-".repeat(36)},
     {duplicate:["x"]},{collegeId:courseId},{role:"SUPER_ADMIN"},
   ])expect(parseSuperAdminCourseQuery(invalid)).toBeNull();
 });
 it("never adds a foreign course to a scoped search or mutates its input rows",()=>{
   const data=[
     {id:"a",name:"Intro",code:"CS100",departmentName:"Physics"},
     {id:"b",name:"Team Project",code:"CS200",departmentName:"Computing"},
   ];
   const query=parseSuperAdminCourseQuery({q:"Team",page:"1"});
   expect(query).not.toBeNull();
   if(!query)return;
   const selected=paginateCollegeCourses(data,query.catalogueQuery);
   expect(selected.items.map(x=>x.id)).toEqual(["b"]);
   expect(selected.total).toBe(1);
   expect(data.map(x=>x.id)).toEqual(["a","b"]);
 });
 it("requires all published ancestry before displaying Students Visible",()=>{
   const input={status:"PUBLISHED",visibleToStudents:true,lessonStatus:"ACTIVE",
     learningPathStatus:"PUBLISHED",offeringStatus:"ACTIVE",courseStatus:"ACTIVE"};
   expect(effectiveCourseContentVisibleToStudents(input)).toBe(true);
   for(const patched of [
     {status:"DRAFT"},{visibleToStudents:false},{lessonStatus:"ARCHIVED"},
     {learningPathStatus:"DRAFT"},{offeringStatus:"ARCHIVED"},{courseStatus:"ARCHIVED"},
   ])expect(effectiveCourseContentVisibleToStudents({...input,...patched})).toBe(false);
 });
 it("keeps legacy public resource links HTTPS-only and retains scope and paging",()=>{
   expect(safePublicCourseContentUrl("https://example.edu/lesson")).toBe("https://example.edu/lesson");
   for(const link of [
     "http://example.edu/file","javascript:alert(1)",
     "https://user:pass@example.edu/file",
     "https://example.edu/file#token","not a link",
     "https://localhost/internal","https://127.0.0.1/metadata",
     "https://10.1.0.1/private","https://192.168.1.1/admin",
     "https://169.254.169.254/latest/meta-data/",
     "https://[::1]/internal",
   ])expect(safePublicCourseContentUrl(link)).toBeNull();
   const filters=adminContentQuerySchema.parse({
     q:"  lecture  ",status:"PUBLISHED",page:"3",offeringId:courseId,scope:"SECTION",
   });
   const href=adminContentHref("VIDEOS",filters);
   expect(href).toContain("/admin/videos?");
   expect(href).toContain("page=3");
   expect(href).toContain("scope=SECTION");
   expect(contentTypesForKind("VIDEOS")).toEqual(["VIDEO","YOUTUBE"]);
   expect(contentTypesForKind("RESOURCES")).toEqual(["RESOURCE"]);
   expect(contentTypesForKind("LIVE_CLASSES")).toEqual(["LIVE_CLASS"]);
   expect(adminContentQuerySchema.safeParse({page:["1"]}).success).toBe(false);
 });
 it("does not replace an authorized content result with an empty view when optional pickers fail",()=>{
   const directory=read("src/components/courses/super-admin-content-directory-page.tsx");
   expect(directory).toContain("Promise.allSettled([");
   expect(directory).toContain('if(dataResult.status==="rejected")');
   expect(directory).toContain('lessonsResult.status==="fulfilled"');
   expect(directory).toContain('sectionsResult.status==="rejected"');
   expect(directory).toContain("Existing content remains visible");
   expect(directory).toContain("Your selected filters are still applied");
   expect(directory).not.toContain(".catch(()=>({ok:false");
   const page=read("src/app/(authenticated)/admin/courses/page.tsx");
   expect(page).toContain("parseSuperAdminCourseQuery(query)");
   expect(page).toContain("if(!parsed)");
 });
});
