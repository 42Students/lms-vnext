import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const routes=readFileSync(join(process.cwd(),"src/app/api/courses/route.ts"),"utf8");
const slugRoute=readFileSync(join(process.cwd(),"src/app/api/courses/by-slug/[slug]/route.ts"),"utf8");
const detailRoute=readFileSync(join(process.cwd(),"src/app/api/courses/[courseId]/route.ts"),"utf8");

describe("legacy course API transition is explicit and scope-safe",()=>{
 it("enumerates historical collection, pagination, detail, create/update/delete and restore paths",()=>{
  for(const operation of [
   "GET /fetch","GET /fetchAll","GET /fetchAllPaged",
   "GET /fetchByCollege","GET /fetchByCollegePaged",
   "GET /fetchCourse","GET /by-slug/{slug}","GET /{courseId}/slug",
   "GET /fetchCourseName","POST /create","PUT /update/{id}",
   "DELETE /delete/{id}","GET /deleted","POST /restore/{id}",
  ])expect(routes).toContain('"'+operation+'":');
 });
 it("documents envelope and page numbering mismatch rather than installing unsafe aliases",()=>{
  expect(routes).toContain("Spring PageResponseDTO was 0-based");
  expect(routes).toContain("vNext paging is 1-based");
  expect(routes).toContain("legacy integer IDs via an");
  expect(routes).toContain("does not install a redirect");
  expect(routes).toContain("listCoursesPage(context,collegeId");
  expect(routes).toContain("totalElements:listing.total");
 });
 it("guards slug and detail reads by authenticated college access",()=>{
  expect(slugRoute).toContain("requirePermission(context, \"courses.read\"");
  expect(slugRoute).toContain('collegeParams.length !== 1');
  expect(detailRoute).toContain('requirePermission(context,"courses.read"');
  expect(detailRoute).toContain('if(/^\\d+$/.test(id))');
 });
});