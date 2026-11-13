import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("UX-G156 TPO batch and audit response honesty",()=>{
 it("does not fabricate recipient counts from invitable or zero defaults",()=>{
  const ui=source("src/components/tpo/tpo-batch-invitation-control.tsx");
  expect(ui).toContain("function confirmedRecipientCount(value:unknown)");
  expect(ui).toContain("Number.isSafeInteger(value)&&value>=0");
  expect(ui).toContain("if(!confirmedRecipientCount(data?.notifiedCount))");
  expect(ui).not.toContain("body.notifiedCount ?? props.invitable");
  expect(ui).toContain("if(!confirmedRecipientCount(receipt?.reminded)");
  expect(ui).toContain("The invitation may have saved, but its recipient count could not be verified.");
  expect(ui).toContain("Reminder outcome could not be verified.");
 });
 it("keeps stale class decisions and errors in the confirmation dialog",()=>{
  const ui=source("src/components/tpo/tpo-batch-class-decision.tsx");
  expect(ui).toContain('expectedVersion');
  expect(ui).toContain('credentials:"same-origin"');
  expect(ui).toContain('role="alert" className="text-sm text-error"');
  expect(ui).toContain("Class decision changed; refresh and retry.");
  expect(ui).toContain("if(inFlightRef.current||busy||!changed||finished)return");
 });
 it("rejects malformed saved audit response before rendering it",()=>{
  const ui=source("src/components/tpo/tpo-audit-saved-views.tsx");
  expect(ui).toContain("function isAuditSavedViewList(value:unknown)");
  expect(ui).toContain("Array.isArray(obj.views)");
  expect(ui).toContain("tpoAuditSavedFiltersSchema.safeParse(view.filters).success");
  expect(ui).toContain("if(!isAuditSavedViewList(response))");
 });
 it("forbids development fixtures in production",()=>{
  const ui=source("src/app/e2e/ux-g156-fixture/page.tsx");
  expect(ui).toContain('process.env.NODE_ENV!=="development"');
  expect(ui).toContain('env.UX_G156_FIXTURE!=="1"');
  expect(ui).toContain('notFound()');
 });
});
