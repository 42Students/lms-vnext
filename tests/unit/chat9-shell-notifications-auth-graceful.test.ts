import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Shell notification and session resilience",()=>{
 it("LEARNER-profile-misc-R01 opens the eight-item guarded learner notification drawer",()=>{
  const bell=source("src/components/shell/learner-notification-bell.tsx");
  const tools=source("src/components/shell/learner-topbar-tools.tsx");
  expect(tools).toContain("<LearnerNotificationBell");
  expect(bell).toContain('aria-haspopup="dialog"');
  expect(bell).toContain("items.slice(0,8)");
  expect(bell).toContain("See all notifications");
  expect(bell).toContain("Showing the last successful notifications");
  expect(bell).toContain("Retry notifications");
 });
 it("PUB-auth-public-20 and PUB-auth-public-21 coordinate cross-tab logout with guarded session requests",()=>{
  const file=source("src/components/shell/account-actions.tsx");
  expect(file).toContain('window.addEventListener("storage",sync)');
  expect(file).toContain('window.localStorage.setItem("lms:signout"');
  expect(file).toContain('apiFetch("/api/auth/session"');
 });
 it("PUB-auth-public-22 keeps the membership selector usable after an API failure",()=>{
  const file=source("src/components/shell/membership-switcher.tsx");
  expect(file).toContain('apiFetch("/api/auth/memberships"');
  expect(file).toContain('disabled={pending}');
  expect(file).toContain('<InlineNotice tone="error"');
 });
 it("GR-70 GR-75 never collapse the bell or sidebar when one request fails",()=>{
  const bell=source("src/components/shell/learner-notification-bell.tsx");
  expect(bell).toContain('apiFetch<');
  expect(bell).toContain("GracefulPageLoading");
 });
});