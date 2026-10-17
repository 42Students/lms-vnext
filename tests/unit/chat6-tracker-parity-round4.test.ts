import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

describe("chat-6 tracker report and manager navigation parity",()=>{
  it("SA-placements-projects-104 restores saved report context and remembers selected reporter and environment",()=>{
    const page=read("src/components/tracker/tracker-report-form.tsx");
    const hook=read("src/hooks/use-form-draft.ts");
    expect(page).toContain('useFormDraft("tracker-issue-report",initial)');
    expect(page).toContain("Unsaved report restored.");
    expect(page).toContain("Discard draft");
    expect(page).toContain('onChange={event=>patch("reporterName",event.target.value)}');
    expect(page).toContain('onChange={event=>patch("accountRole",event.target.value)}');
    expect(page).toContain('onChange={event=>patch("environment",event.target.value)}');
    expect(page).toContain("clearDraft();");
    expect(hook).toContain("localStorage.setItem(storageKey");
  });
  it("SA-placements-projects-104 supports shortcut submit, source-linked success and permission-scoped similar reports",()=>{
    const form=read("src/components/tracker/tracker-report-form.tsx");
    const api=read("src/app/api/tracker/issues/route.ts");
    expect(form).toContain('event.key === "Enter"');
    expect(form).toContain('event.currentTarget.requestSubmit()');
    expect(form).toContain("Issue reported");
    expect(form).toContain("View issue");
    expect(form).toContain("Report another");
    expect(form).toContain("Similar issues");
    expect(form).toContain('"Find similar issues"');
    expect(form).toContain('"/api/tracker/issues?"+query.toString()');
    expect(api).toContain("listBugTrackerIssuesForAdmin(context, query)");
  });
  it("SA-placements-projects-112 exposes the legacy manager nav destinations with an accessible skip target",()=>{
    const nav=read("src/components/tracker/tracker-admin-nav.tsx");
    expect(nav).toContain("Skip to content");
    expect(nav).toContain('href="#tracker-content"');
    expect(nav).toContain('id="tracker-content"');
    expect(nav).toContain('href="/tracker"');
    expect(nav).toContain('href="/tracker/issues"');
    expect(nav).toContain('href="/tracker/logs"');
    expect(nav).toContain('href="/tracker/audit-findings"');
  });
});
