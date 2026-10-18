import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

/** UX-tpo-LAST-THIRD-01: exact ordered master inventory positions 85–126.
 * These source/page contracts supplement, but do not replace, browser journey tests.
 */
// The inventory path includes a parenthesized Next.js route group. Do not stop at the first closing parenthesis.
const inventoryLines=readFileSync("docs/orchestrator/ui-ux/pages-tpo.md","utf8")
 .split("\n").filter(line=>line.startsWith("- [ ] `")||line.startsWith("- [x] `"));
const pages=inventoryLines.slice(84).map(line=>{
 const match=line.match(/`([^`]+)` \((src\/app\/.*\/page\.tsx)\)$/);
 if(!match)throw new Error("Malformed TPO page inventory entry: "+line);
 return [match[1],match[2]] as const;
});
const read=(p:string)=>readFileSync(p,"utf8");
const layout=read("src/app/(authenticated)/tpo/layout.tsx");
const errorPage=read("src/app/(authenticated)/tpo/error.tsx");
const loadingPage=read("src/app/(authenticated)/tpo/loading.tsx");

describe("UX-tpo-LAST-THIRD-01: route-level security and resilient rendering",()=>{
 it("preserves the complete last 42 TPO routes without silent omissions or duplicates",()=>{
  expect(pages).toHaveLength(42);
  expect(new Set(pages.map(([route])=>route)).size).toBe(42);
  expect(pages[0]?.[0]).toBe("/tpo/reports/by-branch");
  expect(pages[41]?.[0]).toBe("/tpo/verification");
 });
 it("TPO route boundary denies unscoped or expired sessions before mounting any page",()=>{
  expect(layout).toContain("getCurrentRequestContext()");
  expect(layout).toContain("canOpenTpoWorkspace(context)");
  expect(layout).toContain("redirect(deniedPortalHome(context))");
  expect(layout).toContain("{children}");
 });
 it("TPO route-wide loading and error boundaries render recovery, not raw exceptions",()=>{
  expect(loadingPage).toContain("GracefulPageLoading");
  expect(errorPage).toContain("GracefulErrorBoundary");
  expect(errorPage).toContain("reset");
  const reportError=read("src/app/(authenticated)/tpo/reports/error.tsx");
  expect(reportError).toContain("role=\"alert\"");
  expect(reportError).toContain("onClick={reset}");
  expect(reportError).toContain("No placement total");
  const settingsError=read("src/app/(authenticated)/tpo/settings/error.tsx");
  expect(settingsError).toContain("onClick={reset}");
  expect(settingsError).toContain("No fallback has been substituted");
 });
 it.each(pages)("UX-tpo-LAST-THIRD-01 / %s has a named server page, inherited tenant guard and no raw secret render", (route,file)=>{
  expect(file).toMatch(/^src\/app\/\(authenticated\)\/tpo\/.+\/page\.tsx$/);
  const source=read(file);
  expect(source,route).toMatch(/export default async function/);
  expect(source,route).toContain("await ");
  expect(source,route).not.toContain("dangerouslySetInnerHTML");
  expect(source,route).not.toContain("JSON.stringify(process.env)");
  expect(source,route).not.toContain("console.log(context)");
 });
 it.each(pages.filter(([route])=>route.startsWith("/tpo/reports/")))("UX-tpo-LAST-THIRD-01 / %s reads an authenticated report in the current scope",(route,file)=>{
  const source=read(file);
  expect(source,route).toContain("getCurrentRequestContext");
  expect(source,route).toMatch(/await [a-zA-Z]/);
  expect(source,route).toMatch(/hasMembershipRole|requireTpo|requirePlacementManageScope/);
 });
 it.each(pages.filter(([route])=>route.startsWith("/tpo/settings/")))("UX-tpo-LAST-THIRD-01 / %s retains a navigable settings section and scoped read",(route,file)=>{
  const source=read(file);
  expect(source,route).toContain("TpoSettingsNav");
  expect(source,route).toContain("getCurrentRequestContext");
 });
 it("legacy /tpo/settings index redirects through the centralized, allowlisted mapping",()=>{
  const index=read("src/app/(authenticated)/tpo/settings/page.tsx");
  const redirect=read("src/components/tpo/tpo-legacy-settings-redirect.tsx");
  expect(index).toContain("TpoLegacySettingsRedirect");
  expect(redirect).toContain("LEGACY_TABS");
  expect(redirect).toContain('LEGACY_TABS[key]??"rules"');
  expect(redirect).toContain('router.replace("/tpo/settings/"');
 });
});
