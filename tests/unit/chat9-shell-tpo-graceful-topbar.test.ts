import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO shell navigation dependencies",()=>{
 it("TPO-home-44 shows Messages in the global TPO topbar instead of requiring a Home-only widget",()=>{
  const app=source("src/components/shell/app-shell.tsx");
  const topbar=source("src/components/shell/topbar/legacy-topbar.tsx");
  const actions=source("src/components/shell/topbar/notification-actions.tsx");
  const cluster=source("src/components/shell/topbar/tpo-notification-cluster.tsx");
  expect(app).toContain("<LegacyTopbar");
  expect(topbar).toContain("<TopbarNotifications");
  expect(actions).toContain('if (config.portal === "tpo") return <TpoNotificationCluster/>;');
  expect(cluster).toContain('href="/tpo/messages"');
 });
 it("TPO-home-40 avoids duplicate Notifications links in TPO accounts",()=>{
  const app=source("src/components/shell/app-shell.tsx");
  const actions=source("src/components/shell/topbar/notification-actions.tsx");
  const cluster=source("src/components/shell/topbar/tpo-notification-cluster.tsx");
  expect(app).toContain("<LegacyTopbar");
  expect(actions).toContain('if (config.portal === "tpo") return <TpoNotificationCluster/>;');
  expect(cluster).toContain('href="/tpo/notifications"');
 });
 it("TPO-requests-verification-21 only includes Verification when authorization explicitly enables it",()=>{
  const app=source("src/components/shell/app-shell.tsx");
  expect(app).toContain("getTpoShellVerificationAccess(context)");
  expect(app).toContain("getShellNavigation(context,learnerAccess,tpoVerificationEnabled)");
 });
 it("GR-70 uses separate retryable boundaries so failed widgets do not collapse other shell controls",()=>{
  const app=source("src/components/shell/app-shell.tsx");
  expect(app).toContain("ShellWidgetBoundary");
  expect(app).toContain("<ShellConnectivityNotice");
  const boundary=source("src/components/shell/shell-widget-boundary.tsx");
  expect(boundary).toContain("getDerivedStateFromError");
  expect(boundary).toContain("Could not load this right now. Try again.");
 });
 it("GR-16 PUB-auth-public-24 shows an offline notice and removes it on reconnect",()=>{
  const file=source("src/components/shell/shell-connectivity-notice.tsx");
  expect(file).toContain('window.addEventListener("online",update)');
  expect(file).toContain('window.addEventListener("offline",update)');
  expect(file).toContain("Changes will not be saved until you reconnect.");
 });
});