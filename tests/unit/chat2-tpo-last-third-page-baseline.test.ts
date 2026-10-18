import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const manifest=readFileSync("docs/orchestrator/ui-ux/pages-tpo.md","utf8");
const pages=manifest.split(/\r?\n/).filter(line=>line.startsWith("- [")).slice(-42).map(line=>{
 const match=line.match(/\`(\/tpo[^\`]+)\` \((src\/app\/\(authenticated\)\/tpo\/[^)]+\/page\.tsx)\)/);
 if(!match)throw new Error("Unexpected TPO route manifest row: "+line);
 return {route:match[1]!,path:match[2]!};
});
const read=(route:string)=>{
 const page=pages.find(item=>item.route===route);
 if(!page)throw new Error("Not a last-third TPO route: "+route);
 return readFileSync(page.path,"utf8");
};
describe("chat-2 last-third TPO pages: role-scoped route and recovery baseline",()=>{
 it("UX-tpo-last-third-coverage-01 tracks the exact 42 assigned route surfaces",()=>{
  expect(pages).toHaveLength(42);
  expect(pages[0]?.route).toBe("/tpo/reports/by-branch");
  expect(pages[41]?.route).toBe("/tpo/verification");
  expect(new Set(pages.map(p=>p.route)).size).toBe(42);
 });
 it.each(pages.filter(p=>p.route!=="/tpo/settings"))(
  "UX-tpo-last-third-coverage-02 $route reads identity in the server page before it exposes records",
  ({path})=>{
   const s=readFileSync(path,"utf8");
   expect(s).toContain("getCurrentRequestContext");
   expect(s).not.toContain("JSON.stringify(error)");
   expect(s).not.toContain("window.confirm(");
   expect(s).not.toContain("dangerouslySetInnerHTML");
  }
 );
 it("UX-tpo-settings-legacy-01 maintains a bounded legacy tab mapping, not an open redirect",()=>{
  const s=read("/tpo/settings");
  const redirect=readFileSync("src/components/tpo/tpo-legacy-settings-redirect.tsx","utf8");
  expect(s).toContain("<TpoLegacySettingsRedirect tab={tab}/>");
  expect(redirect).toContain('router.replace("/tpo/settings/"+(LEGACY_TABS[key]??"rules"))');
  expect(redirect).toContain('window.location.hash');
  expect(redirect).toContain('role="status"');
  expect(redirect).not.toContain("window.location.assign");
 });
 it.each(pages.filter(p=>p.route.startsWith("/tpo/reports/")))(
  "UX-tpo-last-third-reports-01 $route keeps an explicit reporting header",
  ({path})=>{
   const s=readFileSync(path,"utf8");
   expect(s).toContain("PageHeader");
   expect(s).toContain("getCurrentRequestContext");
   expect(s).not.toContain("JSON.stringify(error)");
  }
 );
 it("UX-tpo-reports-company-01 keeps ambiguous query parameters out of scoped report reads",()=>{
  const s=read("/tpo/reports/by-company");
  expect(s).toContain("tpoReportHasAmbiguousFilters(query)");
  expect(s).toContain("companyReportViewSchema.safeParse");
  expect(s).toContain("getPlacementReportWorkspace(context");
  expect(s).toContain('collegeId: context.membership.collegeId');
  expect(s).toContain("No company records match these filters");
  expect(s).toContain("Export visible companies CSV");
 });
 it("UX-tpo-reports-unplaced-01 warns on foreign college batch and branch filters",()=>{
  const s=read("/tpo/reports/unplaced");
  expect(s).toContain("!permittedBatch");
  expect(s).toContain("!permittedBranch");
  expect(s).toContain("does not belong to this college");
  expect(s).toContain("Clear filters");
 });
 it("UX-tpo-team-everyone-01 preserves messages on backend failure and paginates explicitly",()=>{
  const s=read("/tpo/team/everyone");
  expect(s).toContain('hasMembershipRole(context,"TPO")');
  expect(s).toContain("error instanceof AuthorizationError");
  expect(s).toContain('result.status==="FAILED"');
  expect(s).toContain('role="alert"');
  expect(s).toContain("Your messages were not changed.");
  expect(s).toContain("Newer messages");
  expect(s).toContain("Older messages");
 });
 it("UX-tpo-prep-readiness-01 preserves saved settings when dependent courses cannot load",()=>{
  const s=read("/tpo/settings/prep-readiness");
  expect(s).toContain("tpoPrepConfigSchema.safeParse");
  expect(s).toContain("!coursesResult.ok");
  expect(s).toContain("Saved choices were not changed.");
  expect(s).toContain("parsed.success&&coursesResult.ok");
  expect(s).toContain('role="alert"');
  expect(s).toContain("getTpoCommunicationSettings(context)");
 });
 it("UX-tpo-requests-01 requires a current TPO actor and gives recoverable request errors",()=>{
  const s=read("/tpo/requests");
  expect(s).toContain("await requireTpoBatchActor(context)");
  expect(s).toContain('title="Requests"');
  expect(s).toContain('role="alert"');
 });
 it("UX-tpo-students-01 guards direct student data access and all in-page write actors",()=>{
  const s=read("/tpo/students");
  expect(s).toContain("await requireTpoBatchActor(context)");
  expect(s).toContain('requirePermission(context, "placements.manage"');
  expect(s).toContain("requirePlacementManageScope(context, collegeId)");
  expect(s).toContain("getCurrentRequestContext");
 });
});
