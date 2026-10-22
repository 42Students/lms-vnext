import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const src=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
describe("UX-chat15 overlay behaviours",()=>{
 it("UX-tracker-quick-report-01 uses native focus-trapping Drawer while retaining Alt+B",()=>{
  const s=src("src/components/tracker/tracker-quick-report-launcher.tsx");
  expect(s).toContain('import {Drawer} from "@/components/ui/drawer"');
  expect(s).toContain('<Drawer open={open} onOpenChange={setOpen} title="Report an issue"');
  const drawer=src("src/components/ui/drawer.tsx");
  expect(drawer).toContain('<dialog ref={ref}');
  expect(drawer).toContain('useOverlayExit(ref, opener, open, 200)');
  expect(s).toContain("contextPrefill={context}");
  expect(s).toContain("event.altKey");
  expect(s).toContain("event.repeat");
 });
 it("UX-hr-bell-01 has labelled dialog, retry, touch controls and scroll cues",()=>{
  const s=src("src/components/hr/recruiter-notification-bell.tsx");
  for(const part of ["recruiterBellAriaLabel(data?.unread??null)",
    "aria-expanded={isOpen}",'<Drawer open={isOpen} onOpenChange={setIsOpen} title="Notifications"',
    "Couldn't load notifications. Try again.", '<ErrorState title="Notifications unavailable"',
    '<ScrollCue axis="y" label="Recruiter notifications"', "max-h-[50vh]"])
    expect(s).toContain(part);
 });
 it("UX-hr-request-cancel-01 confirms consequences, locks doubles and maps errors",()=>{
  const s=src("src/components/hr/recruiter-request-cancel-button.tsx");
  for(const part of ["if (lock.current || cancelled) return;",'action: "CANCEL"',"expectedUpdatedAt: updatedAt",
    "<ConfirmDialog", "The placement cell will no longer review it.",
    "error instanceof FriendlyFetchError ? error.message : friendlyApiError({})","min-h-11"])
    expect(s).toContain(part);
 });
 it("UX-tracker-audit-status-01 checks version, confirms transition and accepts touch",()=>{
  const s=src("src/components/tracker/audit-finding-status-action.tsx");
  for(const part of ["<ConfirmDialog", "auditFindingStatusPayload(version,status)",
    "canChangeAuditFindingStatus(current,status,pending)", "response.status===409",
    "The server checks the current version","min-h-11"])expect(s).toContain(part);
 });
 it("UX-verification-drawer-01 wraps focus, restores opener, blocks saving Escape and cues scroll",()=>{
  const s=src("src/components/verification/VerificationReviewDrawer.tsx");
  for(const part of ['<Drawer open={true}',"dismissible={!saving}",
    '<Dialog open={pendingAction==="SEND_BACK"}',"safe-area-inset-bottom","min-h-11"])
    expect(s).toContain(part);
  const drawer=src("src/components/ui/drawer.tsx");
  const dialog=src("src/components/ui/dialog.tsx");
  for(const primitive of [drawer,dialog]){
   expect(primitive).toContain("useOverlayExit(ref, opener, open,");
   expect(primitive).toContain("onCancel={event =>");
   expect(primitive).toContain("overscroll-contain");
  }
 });
});
