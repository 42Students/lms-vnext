import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("SA-academics-people-47 scoped batch and class administration",()=>{
 it("uses persisted selected-college permission for both academic mutation services",()=>{
  for(const name of ["college-cohort-mutation-service.ts","college-section-mutation-service.ts"]){
   const source=readFileSync("src/modules/academics/"+name,"utf8");
   expect(source).toContain('resolveActingCollege(context, "academics.manage")');
  }
 });
 it("mounts create, edit and remove controls for selected Super Admin college",()=>{
  const batches=readFileSync("src/app/(authenticated)/admin/batches/page.tsx","utf8");
  const classes=readFileSync("src/app/(authenticated)/admin/classes/page.tsx","utf8");
  expect(batches).toContain("<CollegeCohortCreateForm");
  expect(batches).toContain("<CollegeCohortRowActions");
  expect(classes).toContain("<CollegeClassCreate");
  expect(classes).toContain("<CollegeClassRowActions");
  expect(batches).toContain("context.adminScope?.collegeId");
  expect(classes).toContain("context.adminScope?.collegeId");
 });
});
