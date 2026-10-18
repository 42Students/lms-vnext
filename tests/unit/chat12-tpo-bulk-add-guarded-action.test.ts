import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const ui=readFileSync(new URL("../../src/components/tpo/tpo-students-bulk-add.tsx",import.meta.url),"utf8");

describe("TPO-students-14 bulk add CSRF and double-submission guards",()=>{
 it("locks both preflight and student additions synchronously, even with repeated clicks",()=>{
  expect(ui).toContain("useGuardedAction()");
  expect(ui.match(/await runGuarded\(async\(\)=>\{/g)).toHaveLength(2);
  expect(ui).toContain("if(busy||guardedPending||!driveId");
  expect(ui).toContain("if (busy || guardedPending || !driveId");
  expect(ui).toContain("onClick={()=>void submit()}");
  expect(ui).not.toContain("runGuarded(submit)");
  expect(ui).toContain('method:"POST",credentials:"same-origin"');
 });
 it("only commits a previewed, unchanged selected role and membership set",()=>{
  expect(ui).toContain("reviewedSelection!==selectionFingerprint");
  expect(ui).toContain("response.totalChecked!==pageSelected.length");
  expect(ui).toContain("payload.membershipIds.length !== pageSelected.length");
  expect(ui).toContain("pageSelected.length>200");
  expect(ui).toContain("includeIneligible && overrideReason.trim().length<3");
 });
 it("returns an actionable partial failure without claiming unconfirmed student additions",()=>{
  expect(ui).toContain("Could not verify the addition. Refresh drive applications before retrying.");
  expect(ui).toContain("Could not check existing applications. Your selection remains for retry.");
  expect(ui).toContain('result.status==="added"||result.status==="already-added"');
 });
});
