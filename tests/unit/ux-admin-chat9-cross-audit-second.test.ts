import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const route=(path:string)=>source("src/app/(authenticated)/admin/"+path+"/page.tsx");

describe("UX cross-audit /admin second third (chat-9)",()=>{
 it("UX-admin-inbound-mail-02 shows an honest unavailable-storage retry and accessible filters",()=>{
  const page=route("inbound-mail");
  expect(page).toContain("The inbox is unavailable; this is not a zero-message result.");
  expect(page).toContain('href="/admin/inbound-mail"');
  expect(page).toContain(">Retry</Link>");
  for(const ctl of ["<Input","<Select","<Button"])expect(page).toContain(ctl);
  expect(page).toContain('min-h-11 min-w-11 shrink-0 items-center justify-center');
 });
 it("UX-admin-lecture-halls-02 preserves query-scoped paging and native shared controls",()=>{
  const page=route("lecture-halls");
  for(const ctl of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(ctl);
  expect(page).toContain("superAdminLectureHallHref({...query,page})");
  expect(page).toContain("Select a college to continue");
 });
 it("UX-admin-lecture-halls-03 keeps every action visible on a phone and preserves failed drafts",()=>{
  const page=source("src/components/admin/lecture-hall-manager.tsx");
  expect(page).toContain('mobilePriority: "primary"');
  expect(page).toContain('mobilePriority: "action"');
  expect(page).toContain('className="min-h-11 md:min-h-9"');
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).toContain('setFormError("Could not save the hall. Check your connection and retry.")');
  expect(page).toContain('if (!response.ok)');
  expect(page).toContain('!value && !pending && setEditing(null)');
  expect(page).toContain("grid-cols-1 gap-3 sm:grid-cols-2");
 });
 it("UX-admin-organizations-02 mounts one responsive DataTable, not duplicate action forms",()=>{
  const page=route("organizations");
  expect(page.match(/<DataTable\b/g)?.length).toBe(1);
  expect(page).not.toContain('aria-label="Organization cards"');
  expect(page).toContain('mobilePriority: "action"');
  expect(page).toContain('mobilePriority: "primary"');
  expect(page).toContain('<Pagination label="Organization pages"');
  expect(page).toContain("No organizations found.");
 });
 it("UX-admin-people-02 exposes membership actions on phone, supports HR, and protects query arrays",()=>{
  const page=route("people");
  expect(page).toContain('mobilePriority: "action"');
  expect(page).toContain('mobilePriority: "primary"');
  expect(page).toContain('"TPO","HR","COLLEGE_ADMIN"');
  expect(page).toContain("Array.isArray(value)?value[0]:value");
  expect(page).toContain("parsePeoplePage(one(pageParam))");
  expect(page).toContain('<Pagination label="People pages"');
  expect(page).toContain("hrefForPage={href}");
 });
 it("UX-admin-people-directory-02 preserves college privacy and focusable filters/pagination",()=>{
  const page=route("people/directory");
  expect(page).toContain("Email and phone are masked outside a selected college.");
  for(const ctl of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(ctl);
  expect(page).toContain('label="Contacts pages"');
  expect(page).toContain('min-h-11 items-center font-semibold');
 });
 it("UX-admin-placements-analytics-02 shows missing-college help before invoking scoped services",()=>{
  const page=route("placements/analytics");
  const guard=page.indexOf("if(!collegeSelected&&!organizationSelected)");
  expect(guard).toBeGreaterThan(-1);
  expect(guard).toBeLessThan(page.indexOf("getSuperAdminCompanyHiringReport(context,parsed.data)"));
  expect(page).toContain("Choose a reporting scope");
  expect(page).toContain("Select an organization or a college");
  expect(page).toContain('caption="Company hiring report"');
  for(const ctl of ["<Input","<Select","<Button"])expect(page).toContain(ctl);
 });
 it("UX-admin-placements-jobs-02 uses recoverable college-scope states rather than silent redirect",()=>{
  for(const pageName of [
   "placements/jobs/[jobId]",
   "placements/jobs/[jobId]/applications",
   "placements/jobs/[jobId]/schedule",
   "placements/new",
  ]){
   const page=route(pageName);
   expect(page).toContain("Placement administration requires a college safety scope.");
   expect(page).toContain("<EmptyState");
   expect(page).not.toContain('redirect("/admin/placements")');
  }
 });
 it("UX-admin-placements-jobs-applications-02 keeps accessible filters, scoped query links and pagination",()=>{
  const page=route("placements/jobs/[jobId]/applications");
  expect(page).toContain("CollegeApplicationPipelineControls");
  expect(page).toContain('caption="Drive applications"');
  for(const ctl of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(ctl);
  expect(page).toContain("adminHref(jobId,{...query,page})");
  expect(page).toContain("No applications match these filters.");
 });
 it("UX-admin-placements-jobs-schedule-02 retains persisted round DataTable and real candidate actions",()=>{
  const page=route("placements/jobs/[jobId]/schedule");
  expect(page).toContain("<CollegeInterviewAppointments");
  expect(page).toContain('caption="Persisted interview rounds"');
  expect(page).toContain("<Pagination");
  expect(page).toContain("<Select");
  expect(page).toContain("<Button");
  const editor=source("src/components/placements/college-interview-appointments.tsx");
  expect(editor).toContain('<DataTable<(typeof appointments)[number]>');
  expect(editor).toContain('mobilePriority:"action"');
  expect(editor).toContain('mobilePriority:"primary"');
  expect(editor).not.toContain("<table");
  expect(editor).toContain("No interviews scheduled for this drive yet.");
  expect(editor).toContain("<Input");
  expect(editor).toContain("<Select");
 });
 it("UX-admin-placements-jobs-settings-02 treats assessment URLs as untrusted HTTPS-only navigation",()=>{
  const page=route("placements/jobs/[jobId]/settings");
  const component=source("src/components/ui/third-party-link.tsx");
  expect(page).toContain("<ThirdPartyLink");
  expect(page).not.toContain('target="_blank"');
  expect(page).toContain("Assessment URL:");
  expect(component).toContain('url.protocol === "https:"');
  expect(component).toContain("Copy link");
 });
 it("UX-admin-placements-new-02 keeps scoped creation without a blank-page redirect",()=>{
  const page=route("placements/new");
  expect(page).toContain("<PlacementJobCreateWorkspace");
  expect(page).toContain("basePath=\"/admin/placements\"");
  expect(page).toContain("<EmptyState");
 });
 it("UX-admin-live-classes-02 public content links are same-tab, https vetted and phone reachable",()=>{
  const page=source("src/components/courses/super-admin-content-directory-page.tsx");
  expect(page).toContain("<ThirdPartyLink");
  expect(page).toContain('label={item.contentType==="LIVE_CLASS"?"Join":"View"}');
  expect(page).toContain("publicHttpsHref(item.externalUrl)");
  expect(page).toContain("<Pagination");
  expect(page).not.toContain('target="_blank"');
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
 });
 it("UX-admin-placements-calendar-02 all calendar chips/events meet phone size and high contrast focus",()=>{
  const page=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(page).toContain("md:min-h-9");
  expect(source("src/components/ui/filter-chip.tsx")).toContain("min-h-11");
  expect(page).toContain("focus-visible:outline-2");
  expect(page).toContain("min-h-11");
 });
 it("UX-admin-placements-jobs-03 employer portal never launches a raw popup",()=>{
  const page=source("src/components/placements/placement-drive-workspace.tsx");
  expect(page).toContain('label="Open employer portal"');
  expect(page).toContain("<ThirdPartyLink");
  expect(page).not.toContain('target="_blank"');
 });
 it("UX-admin-placements-jobs-04 all drive tabs are 44px and contrast safe",()=>{
  const tabs=source("src/components/placements/super-admin-drive-tabs.tsx");
  expect(tabs).toContain("min-h-11");
  expect(tabs).not.toContain("min-h-10");
  expect(tabs).not.toContain("text-[#26bac7]");
  expect(tabs).toContain('ariaLabel="Drive tabs"');
  expect(tabs).toContain("items={tabs.map");
  expect(source("src/components/ui/tabs.tsx")).toContain("min-h-11");
 });

});
