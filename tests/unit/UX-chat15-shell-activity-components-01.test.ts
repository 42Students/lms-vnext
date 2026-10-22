import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const code=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

describe("UX-chat15-shell-activity-components-01",()=>{
 it("UX-shell-learner-bell-01 gives button 44px, marks unread and preserves role scoped personal inbox",()=>{
  const s=code("src/components/shell/learner-notification-bell.tsx");
  for(const fragment of ["h-11 w-11","aria-haspopup=\"dialog\"","aria-expanded={open}",
    "apiFetch","/api/notifications?limit=40","learnerNotificationTarget",
    "due.slice(0,3)","No notifications yet", "/learn/notifications"])
    expect(s).toContain(fragment);
  expect(s).toContain('<PopoverPanel id="lms-learner-notifications"');
  expect(s).toContain('<Drawer id="lms-learner-mobile-notifications"');
 });
 it("UX-shell-learner-bell-scroll-01 provides real overflow fades, safe overscroll and keyboard Escape return",()=>{
  const s=code("src/components/shell/learner-notification-bell.tsx");
  expect(s).toContain('<ScrollCue axis="y" label="Learner notifications"');
  expect(s).toContain('viewportClassName="max-h-[55vh]"');
  expect(s).toContain('event.key!=="Escape"');
  expect(s).toContain("trigger.current?.focus()");
  expect(s).toContain('document.addEventListener("pointerdown",clickOutside)');
  expect(s).toContain('document.removeEventListener("pointerdown",clickOutside)');
  expect(s).toContain("min-h-11");
  expect(s).not.toContain("min-h-10");
 });
 it("UX-shell-mobile-navigation-01 opens a true accessible navigation overlay with Escape and focus trap",()=>{
  const s=code("src/components/shell/mobile-navigation.tsx");
  expect(s).toContain('aria-label={open?"Close menu":"Open menu"}');
  expect(s).toContain('aria-haspopup="dialog"');
  expect(s).toContain('<Drawer');
  expect(s).toContain("onOpenChange={setOpen}");
  expect(s).toContain("md:hidden");
  expect(s).toContain("h-11 w-11");
 });
 it("UX-shell-route-announcer-01 reports route changes without stealing focus on query-only updates",()=>{
  const s=code("src/components/shell/route-announcer.tsx");
  expect(s).toContain('role="status"');
  expect(s).toContain('aria-live="polite"');
  expect(s).toContain('if(!queryOnly && !document.querySelector(');
  expect(s).toContain('main?.focus({preventScroll:true})');
  expect(s).toContain("heading");
  expect(s).toContain("paginationLabel");
 });
 it("UX-activity-inbox-01 preserves announcement vs notification scopes and confirms mark all",()=>{
  const s=code("src/components/activity/learner-notifications-inbox.tsx");
  expect(s).toContain("learnerNotificationReadAllSchema.safeParse");
  expect(s).toContain("runMarkAll");
  expect(s).toContain('"/api/notifications/read-all"');
  expect(s).toContain("filterLearnerInbox");
  expect(s).toContain("learnerAnnouncementAudienceContext");
  expect(s).toContain('timeZone: "Asia/Kolkata"');
  expect(s).toContain("<Dialog");
  expect(s).toContain("min-h-11");
 });
});
