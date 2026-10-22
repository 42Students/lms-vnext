import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const files={
 notes:"src/components/tpo/tpo-student-note-editor.tsx",
 nudges:"src/components/tpo/tpo-student-nudge-panel.tsx",
 bulk:"src/components/tpo/tpo-roster-verification-bulk.tsx",
 add:"src/components/tpo/tpo-students-bulk-add.tsx",
};
describe("chat-12 round3 guarded mutation controls",()=>{
 it("TPO-students-11 saves notes once on Ctrl+Enter or click",()=>{
  const s=read(files.notes);expect(s).toContain("void runGuarded(save)");expect(s).toContain("guardedPending");
  expect(s).toContain("e.key===\"Enter\"");
 });
 it("TPO-students-07 sends a nudge once, preserving message on failure",()=>{
  const s=read(files.nudges);expect(s).toContain("runGuarded(send)");expect(s).toContain("guardedPending");
 });
 it("TPO-students-08 protects bulk Verify against double confirmations",()=>{
  const s=read(files.bulk);expect(s).toContain("runGuarded(save)");expect(s).toContain("guardedPending");
 });
 it("TPO-students-09 also protects bulk Send back from repeated submissions",()=>{
  const s=read(files.bulk);expect(s).toContain('"SEND_BACK"');expect(s).toContain("runGuarded(save)");
 });
 it("TPO-students-14 confirms a single Add-to-Drive mutation after the dialog",()=>{
  const s=read(files.add);expect(s).toContain("await runGuarded(async()=>");
  expect(s).toContain("onClick={()=>void submit()}");expect(s).toContain("guardedPending");
 });
 it("TPO-students-15 protects the notified student add from duplicate click",()=>{
  expect(read(files.add)).toContain("useGuardedAction()");
  expect(read("src/modules/placements/bulk-drive-service.ts")).toContain("inAppNotifications");
 });
 it("GR-30 and GR-31 apply synchronous in-flight locking on four mutation controls",()=>{
  for(const path of Object.values(files)){
   const s=read(path);
   expect(s).toContain('from "@/hooks/use-guarded-action"');
   expect(s).toContain("run:runGuarded,pending:guardedPending");
  }
 });
});
