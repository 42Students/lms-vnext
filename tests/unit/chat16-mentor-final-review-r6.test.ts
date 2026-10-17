import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const code=()=>readFileSync("src/components/projects/project-final-delivery-controls.tsx","utf8");
describe("chat-16 mentor delivery review verified actions",()=>{
 it("MEN-projects-meetings-65 always requires explicit approval/change confirmation before submitting",()=>{
   const ui=code();
   expect(ui).toContain('onClick={()=>setConfirmReview(true)}');
   expect(ui).toContain('open={confirmReview} onOpenChange={setConfirmReview}');
   expect(ui).toContain('onConfirm={()=>void review()}');
   expect(ui).toContain('confirmLabel={decision==="APPROVED"?"Accept submission":"Request changes"}');
   expect(ui).toContain('decision==="CHANGES_REQUESTED"&&!feedback.trim()');
   expect(ui).toContain('mode!=="MENTOR" ? <label');
 });
 it("MEN-projects-meetings-65 preserves feedback on conflict and refuses raw exception text",()=>{
   const ui=code();
   expect(ui).toContain('caught instanceof FriendlyFetchError && caught.status===409');
   expect(ui).toContain('setStaleReview(true)');
   expect(ui).toContain('description: caught instanceof FriendlyFetchError?caught.message:friendlyApiError({})');
   expect(ui).toContain('onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}');
   expect(ui).toContain('useProjectEditorDiscardGuard(open||confirmReview');
 });
});
