import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(path,"utf8");
const driveCancel=()=>read("src/components/placements/tpo-drive-cancel-form.tsx");
const driveLifecycle=()=>read("src/components/placements/tpo-drive-lifecycle-controls.tsx");
const batchLifecycle=()=>read("src/components/tpo/tpo-batch-lifecycle-control.tsx");
const batchImport=()=>read("src/components/tpo/tpo-batch-eligibility-import.tsx");
describe("Chat-5 graceful-operation adoption",()=>{
 it("GR-04 uses guarded JSON fetch in all four changed mutating forms",()=>{
  for(const component of [driveCancel(),driveLifecycle(),batchLifecycle(),batchImport()]){
   expect(component).toContain('from "@/lib/api-fetch"');
   expect(component).toContain("apiFetch");
   expect(component).not.toContain("response.json()");
  }
 });
 it("GR-30 relies on the synchronous guarded-action hook for critical state changes",()=>{
  for(const component of [driveCancel(),driveLifecycle(),batchLifecycle()]){
   expect(component).toContain("useGuardedAction");
   expect(component).toContain("await run(async()=>");
  }
 });
 it("GR-31 protects duplicate Enter and click during cancellation and publishing",()=>{
  expect(driveCancel()).toContain("if (pending || !reviewed) return");
  expect(driveLifecycle()).toContain("pending || !acknowledged");
  expect(batchLifecycle()).toContain("if(disabled)return");
 });
 it("GR-32 retains user edits after a changed import or failed write",()=>{
  const component=batchImport();
  expect(component).toContain("e.status===409");
  expect(component).toContain("Your import is still here");
  expect(component).toContain("setCsv");
  expect(component).toContain("setPreview(null);setAcknowledged(false);router.refresh()");
 });
 it("GR-35 uses an inline consequence acknowledgement rather than native confirm",()=>{
  for(const component of [driveCancel(),driveLifecycle(),batchLifecycle(),batchImport()]){
   expect(component).not.toContain("window.confirm");
   expect(component).toMatch(/<Checkbox\b|type="checkbox"/);
  }
 });
 it("GR-71 keeps a recoverable empty state for older batches",()=>{
  const page=read("src/app/(authenticated)/tpo/batches/page.tsx");
  expect(page).toContain("older");
  expect(page).toContain("Show older batches");
  expect(page).toContain("Hide older batches");
 });
 it("GR-90 announces failures through role alert in all affected forms",()=>{
  for(const component of [driveCancel(),driveLifecycle(),batchLifecycle(),batchImport()]){
   expect(component).toMatch(/<InlineNotice tone="error"|role="alert"/);
  }
  const notice=read("src/components/ui/inline-notice.tsx");
  expect(notice).toContain('role={tone === "error" ? "alert" : "status"}');
 });
 it("GR-91 keeps explicit acknowledgement and retry controls keyboard-operable",()=>{
  for(const component of [driveCancel(),driveLifecycle(),batchLifecycle(),batchImport()]){
   expect(component).toMatch(/<Checkbox\b|type="checkbox"/);
   expect(component).toContain('type="button"');
  }
 });
});
