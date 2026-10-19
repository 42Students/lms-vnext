import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const base = "src/components/shell/topbar/";
const read = (file: string) => readFileSync(base+file,"utf8");

describe("chat-13 old LMS topbar keyboard, signed-out, and notification interactions",()=>{
 it("TOPBAR-06 provides Ctrl/Cmd K, Escape, portal-safe commands, and a real learner course search",()=>{
  const s=read("command-search.tsx");
  expect(s).toContain('event.key.toLowerCase() === "k"');
  expect(s).toContain("event.ctrlKey || event.metaKey");
  expect(s).toContain('event.key === "Escape"');
  expect(s).toContain('type="search"');
  expect(s).toContain('role="combobox"');
  expect(s).toContain("aria-expanded={open}");
  expect(s).toContain("/api/courses/learner");
  expect(s).toContain('"/learn/courses/" + encodeURIComponent(course.deliveryId) + "/home"');
  expect(s).toContain("topbarCommands(pathname, items)");
 });
 it("TOPBAR-07 keeps the existing signout API, multi-tab logoff and both switchers",()=>{
  const s=read("account-menu.tsx");
  expect(s).toContain('apiFetch("/api/auth/session", { method: "DELETE" })');
  expect(s).toContain('window.localStorage.setItem("lms:signout"');
  expect(s).toContain("<AdminScopeSwitcher");
  expect(s).toContain("<MembershipSwitcher");
  expect(s).toContain("aria-expanded={open}");
  expect(s).toContain('event.key !== "Escape"');
 });
 it("TOPBAR-08 retains existing authenticated notification sources without substituting fabricated unread values",()=>{
  const s=read("notification-actions.tsx");
  expect(s).toContain('"/api/tpo/shell-counts"');
  expect(s).toContain("safeTpoShellCounters(");
  expect(s).toContain("<LearnerNotificationBell />");
  expect(s).toContain("<HrRecruiterBell />");
  expect(s).toContain("shellUnreadBadge(count)");
  expect(s).toContain("count !== null");
  expect(s).toContain('"/api/notifications?limit=40"');
 });
});
