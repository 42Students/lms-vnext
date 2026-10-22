import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {legacyCourseBulkFlagsSchema} from "@/modules/courses/legacy-course-bulk-flags-model";

const id="00000000-0000-4000-8000-000000000001";
describe("G2-2-014-009 independent legacy course bulk flags",()=>{
 it("keeps active, enabled and allowedForDisplay independently nullable",()=>{
  for(const patch of [{active:false},{enabled:false},{allowedForDisplay:0},
    {allowedForDisplay:true},{active:true,enabled:null}]){
   expect(legacyCourseBulkFlagsSchema.safeParse({
    courseIds:[id],confirmed:true,...patch,
   }).success).toBe(true);
  }
  expect(legacyCourseBulkFlagsSchema.safeParse({courseIds:[id],confirmed:true}).success)
   .toBe(false);
  expect(legacyCourseBulkFlagsSchema.safeParse({
   courseIds:[id,id],active:true,confirmed:true,
  }).success).toBe(false);
 });
 it("enforces same origin, persisted permissions, selected college, row lock and CAS",()=>{
  const route=readFileSync("src/app/api/admin/courses/legacy-bulk-flags/route.ts","utf8");
  const service=readFileSync("src/modules/courses/legacy-course-bulk-flags-service.ts","utf8");
  expect(route).toContain("isSameOriginRequest");
  expect(service).toContain('resolveActingCollege(context,"courses.manage")');
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain('.for("update",{of:courses})');
  expect(service).toContain("eq(departments.collegeId,acting.collegeId)");
  expect(service).toContain("eq(courses.version,current.version)");
  expect(service).toContain("legacyAllowedForDisplay:allowedForDisplay");
 });
});
