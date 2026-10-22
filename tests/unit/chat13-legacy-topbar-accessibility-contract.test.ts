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
  expect(s).toContain('"/learn/courses/"+encodeURIComponent(course.deliveryId)+"/home"');
  expect(s).toContain("topbarCommands(pathname, items)");
 });
 it("TOPBAR-07 keeps the existing signout API, multi-tab logoff and both switchers",()=>{
  const s=read("account-menu.tsx");
  expect(s).toContain('apiFetch("/api/auth/session", { method: "DELETE" })');
  expect(s).toContain('window.localStorage.setItem("lms:signout"');
  expect(s).toContain("<AdminScopeSwitcher");
  expect(s).toContain("<MembershipSwitcher");
  expect(s).toContain("{copy.accountHref ? <Link href={copy.accountHref}");
  expect(s).toContain("aria-expanded={open}");
  expect(s).toContain('event.key === "Escape"');
 });
 it("TOPBAR-08 retains existing authenticated notification sources without substituting fabricated unread values",()=>{
  const s=read("notification-actions.tsx");
  const tpo=read("tpo-notification-cluster.tsx");
  const bell=readFileSync("src/components/tpo/tpo-bell-panel.tsx","utf8");
  expect(s).toContain("<TpoNotificationCluster/>");
  expect(tpo).toContain('"/api/tpo/header-snapshot"');
  expect(tpo).toContain("tpoHeaderSnapshotSchema.safeParse");
  expect(tpo).toContain("<TpoBellPanel compact");
  expect(tpo).toContain("count !== null && count > 0");
  expect(bell).toContain('"/api/tpo/notifications/read-all"');
  expect(bell).toContain('"/api/tpo/header-snapshot"');
  expect(bell).toContain('"/read"');
  expect(tpo).toContain('"/tpo/notifications"');
  expect(s).toContain("<LearnerNotificationBell />");
  expect(s).toContain("<HrRecruiterBell />");
  expect(s).toContain("shellUnreadBadge(count)");
  expect(s).toContain("count !== null");
  expect(s).toContain('"/api/notifications?limit=40"');
 });
 it("TOPBAR-09 removes the duplicate TPO strip without losing the keyboard handler and contextual create choices",()=>{
  const layout=readFileSync("src/app/(authenticated)/tpo/layout.tsx","utf8");
  const create=read("tpo-quick-create.tsx");
  const find=read("tpo-find-suggestions.tsx");
  const shortcuts=readFileSync("src/components/tpo/tpo-keyboard-shortcuts.tsx","utf8");
  expect(layout).not.toContain("<TpoHeaderIndicators");
  expect(layout).not.toContain("<TpoFindShortcut");
  expect(layout).not.toContain("<TpoTopbarNewMenu");
  expect(layout).toContain('<TpoKeyboardShortcuts showTrigger={false}');
  expect(create).toContain("<TpoNewFollowupModal");
  expect(create).toContain("TPO_TOPBAR_QUICK_LINKS");
  expect(find).toContain('"/api/tpo/find-suggestions?q="');
  expect(find).toContain("safeTpoFindResult");
  expect(shortcuts).toContain('event.key==="?"');
 });
});
