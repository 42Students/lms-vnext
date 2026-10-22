import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

describe("UX-chat15-overlays-second-pass scroll, dismiss and motion",()=>{
 it("UX-tracker-live-logs-03 uses shared modal for report export, maintains confirmation for muting and 44px hit targets",()=>{
  const s=src("src/components/tracker/tracker-live-logs-explorer.tsx");
  expect(s).toContain('import {Dialog} from "@/components/ui/dialog"');
  expect(s).toContain('<Dialog open={reportOpen} onOpenChange={setReportOpen} title="Report for Claude"');
  expect(s).toContain("<ConfirmDialog open={muteTarget!==null}");
  expect(s).toContain("mutating");
  expect(s).toContain("apiFetch");
  expect(s).toContain("trackerLogMarkdown(items)");
  expect(s).toContain("min-h-11");
  expect(s).not.toContain('className="min-h-10');
  expect(s).not.toContain('{reportOpen?<div role="dialog"');
 });
 it("UX-tracker-telegram-02 keeps explicit consequence and action confirmation and touch-sized actions",()=>{
  const s=src("src/components/tracker/tracker-telegram-manual-panel.tsx");
  expect(s).toContain('<Drawer open={open} onOpenChange={next=>{if(!pending)setOpen(next);}} title="Log digest"');
  expect(s).toContain("Daily digest");
  expect(s).toContain("The sent digest uses up to 100 signatures.");
  expect(s).toContain("Manual sends are rate-limited.");
  expect(s).toContain("if(pending)return");
  expect(s).toContain('<InlineNotice tone={error?"error":"success"} message={notice}/>');
  expect(s).not.toContain("min-h-10");
  expect(s).toContain("min-h-11");
 });
 it("UX-activity-inbox-02 retains shared accessible Dialog, guarded bulk mutation and 44px inputs",()=>{
  const s=src("src/components/activity/learner-notifications-inbox.tsx");
  expect(s).toContain('import { Dialog } from "@/components/ui/dialog"');
  expect(s).toContain("runMarkAll");
  expect(s).toContain("learnerNotificationReadAllSchema.safeParse");
  expect(s).toContain('role="status"');
  expect(s).not.toContain("min-h-10");
  expect(s).toContain("min-h-11");
 });
 it("UX-hr-bell-02 announcement remains distinct from recruiter messages and popover closes with Escape and outside pointer",()=>{
  const s=src("src/components/hr/recruiter-notification-bell.tsx");
  expect(s).toContain('const href="/hr/notifications"');
  expect(s).not.toContain('const href="/hr/messages"');
  expect(s).toContain('<Drawer open={isOpen} onOpenChange={setIsOpen} title="Notifications"');
  expect(s).toContain('ref={triggerRef}');
  expect(s).toContain('onClick={()=>setIsOpen(false)}');
  expect(s).toContain('requestGate.current.invalidate()');
  expect(s).toContain('aria-haspopup="dialog"');
  expect(s).toContain('aria-expanded={isOpen}');
  expect(s).toContain("min-h-11");
 });
});
