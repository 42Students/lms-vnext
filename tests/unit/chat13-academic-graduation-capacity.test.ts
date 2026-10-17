import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin graduation and class capacity",()=>{
 it("SA-academics-people-24 allows a confirmed final-term graduation in the scoped batch promotion workspace",()=>{
  const page=read("src/app/(authenticated)/admin/batch-promotion/page.tsx");
  expect(page).toContain("SuperAdminBatchGraduateAction");
  expect(page).toContain('preview.batch.status === "ACTIVE"');
  expect(page).toContain("preview.batch.currentTermNumber >= preview.batch.durationTerms");
  const action=read("src/components/admin/super-admin-batch-graduate-action.tsx");
  expect(action).toContain("/graduate");
  expect(action).toContain("BATCH_GRADUATION_STALE");
  expect(action).toContain("ConfirmDialog");
  expect(read("src/modules/academics/college-batch-graduation-service.ts")).toContain("resolveActingCollege");
 });
 it("SA-academics-people-41 labels full classes and blocks full-class moves before the request",()=>{
  const classes=read("src/app/(authenticated)/admin/classes/page.tsx");
  const roster=read("src/components/admin/super-admin-batch-roster-manager.tsx");
  expect(classes).toContain("Class full");
  expect(classes).toContain("row.activeLearners>=row.capacity");
  expect(roster).toContain('"Destination class is full."');
  expect(roster).toContain("disabled={c.id!==row.classId&&c.capacity!==null&&c.learnerCount>=c.capacity}");
 });
});
