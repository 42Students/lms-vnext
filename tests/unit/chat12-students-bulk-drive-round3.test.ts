import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Chat-12 Add to Drive notifications and confirmation",()=>{
 it("TPO-students-14 replaces window.confirm with an accessible named dialog and keeps ineligible skips",()=>{
  const c=src("src/components/tpo/tpo-students-bulk-add.tsx");
  expect(c).toContain('title="Add selected students to a drive"');
  expect(c).toContain('onClick={()=>void runGuarded(submit)}');
  expect(c).toContain("useGuardedAction()");
  expect(c).toContain("Ineligible learners will not be added.");
  expect(c).toContain("Existing applications are preserved.");
  expect(c).not.toContain("window.confirm(");
 });
 it("TPO-students-15 persists a learner-facing notification in the same transaction as the new application",()=>{
  const s=src("src/modules/placements/bulk-drive-service.ts");
  expect(s).toContain('await tx.insert(inAppNotifications).values({');
  expect(s).toContain("userId:learner.userId,eventId:activity.id");
  expect(s).toContain('title:"You were added to a placement drive"');
  expect(s).toContain('actionHref:"/learn/my-placements"');
  expect(s).toContain("onConflictDoNothing()");
 });
 it("GR-04 protects bulk drive roles and addition against invalid JSON, network failure and HTML 502",()=>{
  const c=src("src/components/tpo/tpo-students-bulk-add.tsx");
  expect(c).toContain("apiFetch<{roles?:Role[]}>");
  expect(c).toContain("apiFetch<{results:BulkDriveResult[]}>");
  expect(c).not.toContain("body?.error");
 });
});
