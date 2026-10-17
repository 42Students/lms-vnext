import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin faculty assignment copy and audited removal",()=>{
 it("SA-academics-people-103 shows the faculty assignment legacy heading, creation and current assignments labels",()=>{
  const page=source("src/app/(authenticated)/admin/faculty-assignment/page.tsx");
  for(const text of ["Faculty Assignments","Create teaching assignment","Current teaching assignments",
    "Connect faculty to the right class, course, semester and teaching role. Account status and profile changes stay on the Faculty roster."])
    expect(page).toContain(text);
 });
 it("SA-academics-people-103 offers selected-college removal with legacy warning but preserves history",()=>{
  const page=source("src/app/(authenticated)/admin/faculty-assignment/page.tsx");
  const action=source("src/components/courses/admin-course-actions.tsx");
  const route=source("src/app/api/courses/teaching-assignments/[assignmentId]/route.ts");
  const service=source("src/modules/courses/teaching-assignment-service.ts");
  expect(page).toContain('row.status==="ACTIVE"?<TeachingAssignmentActions legacyCopy');
  expect(action).toContain("Delete teaching assignment?");
  expect(action).toContain("This removes the faculty from teaching the listed course.");
  expect(action).toContain('legacyCopy?"Remove teaching assignment":"End Assignment"');
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("endCourseTeachingAssignment");
  expect(service).toContain("endedAt: now");
  expect(source("docs/audit/owner-decisions-resolved.md")).toContain("OD-23");
 });
});
