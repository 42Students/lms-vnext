import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {projectLegacyCoursePublic,type CourseProjectionSource} from "@/modules/courses/legacy-course-public-projection";

const course:CourseProjectionSource={
 id:"11111111-1111-4111-8111-111111111111",
 slug:"c-1234567890",name:"Compiler Design",code:"CS400",
 shortTitle:"Compilers",departmentId:"22222222-2222-4222-8222-222222222222",
 status:"ACTIVE",enabled:true,legacyAllowedForDisplay:0,
 description:"Compiler theory",cardColor:"#26bac7",
 thumbnailUrl:"https://example.org/cover.png",
 imageUrl:"https://user:secret@example.org/private.jpg",
 imageUrlLearningPath:"http://example.org/insecure.jpg",
 takeaways:"Learn parsing\nBuild compilers",orderedTakeaways:null,
};
describe("course legacy-compatible readonly projection",()=>{
 it("uses immutable slug, independent active and visibility flags, and only safe display data",()=>{
  const projection=projectLegacyCoursePublic(course);
  expect(projection.slug).toBe(course.slug);
  expect(projection.slug).not.toBe(course.code);
  expect(projection.active).toBe(true);
  expect(projection.allowedForDisplay).toBe(false);
  expect(projection.metaData.thumbnail).toBe("https://example.org/cover.png");
  expect(projection.metaData.image_url).toBeNull();
  expect(projection.metaData.image_url_lp).toBeNull();
  expect(projection.metaData.takeaways).toEqual(["Learn parsing","Build compilers"]);
  expect(Object.keys(projection).sort()).toEqual([
   "active","allowedForDisplay","courseName","deptId","id","metaData","shortTitle","slug",
  ].sort());
  expect(JSON.stringify(projection)).not.toContain("secret");
 });
 it("never promotes an archived or disabled course to active just because display is permitted",()=>{
  expect(projectLegacyCoursePublic({...course,status:"ARCHIVED",legacyAllowedForDisplay:1}).active).toBe(false);
  const disabled=projectLegacyCoursePublic({...course,enabled:false,legacyAllowedForDisplay:1});
  expect(disabled.active).toBe(false);
  expect(disabled.allowedForDisplay).toBe(true);
 });
 it("serves the optional adapter only after the regular scoped catalogue query",()=>{
  const route=readFileSync("src/app/api/courses/route.ts","utf8");
  expect(route).toContain('rawView==="legacy"');
  expect(route).toContain("listCoursesPage(context,collegeId");
  expect(route).toContain("courses.map(projectLegacyCoursePublic)");
  expect(route).toContain('"Cache-Control":"private, no-store"');
 });
});
