import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("G2-4-004-074/092: secure College Admin assignment resource workflow",()=>{
 it("allows an active persisted College Admin to use the verified private resource writer without a faculty teaching grant",()=>{
  const authoring=readFileSync("src/modules/courses/faculty-assignment-authoring-service.ts","utf8");
  const resource=readFileSync("src/modules/courses/faculty-assignment-resource-service.ts","utf8");
  expect(authoring).toContain('hasMembershipRole(context,"COLLEGE_ADMIN")');
  expect(authoring).toContain('if(admin){');
  expect(authoring).toContain('assertPersistedPlatformPermission(tx,context,"courses.manage"');
  expect(authoring).toContain('if(!liveFaculty)throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED")');
  expect(resource).toContain('member.roles.includes("COLLEGE_ADMIN")');
  expect(resource).toContain('actor!=="FACULTY"&&!admin');
  expect(resource).toContain("createPrivateUploadGrant({");
  expect(resource).toContain("readPrivateObjectAttestation(");
 });
 it("shows the existing signed file/resource editor only with a confirmed saved Section assignment version",()=>{
  const ui=readFileSync("src/components/courses/college-assignment-create.tsx","utf8");
  expect(ui).toContain('savedVersion=typeof payload.assignment.updatedAt==="string"');
  expect(ui).toContain('audience==="SECTION"&&savedVersion');
  expect(ui).toContain("<FacultyAssignmentResourcesEditor");
  expect(ui).toContain("<FacultyAssignmentMaterialLinks");
 });
});
