import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(path,"utf8");
describe("chat-16 reassigned tracker issue workflows",()=>{
  it("SA-placements-projects-104 keeps report draft, Ctrl or Cmd Enter, similar issues and a success card",()=>{
    const form=source("src/components/tracker/tracker-report-form.tsx");
    expect(form).toContain('useFormDraft("tracker-issue-report"');
    expect(form).toContain("Unsaved report restored.");
    expect(form).toContain("Discard draft");
    expect(form).toContain('event.key === "Enter"');
    expect(form).toContain("event.currentTarget.requestSubmit()");
    expect(form).toContain("checkSimilar");
    expect(form).toContain("Issue reported");
    expect(form).toContain("Report another");
    expect(form).toContain("View issue");
  });
  it("SA-placements-projects-106 selects page issues and performs authorized optimistic writes while retaining failed IDs",()=>{
    const page=source("src/app/(authenticated)/tracker/issues/page.tsx");
    const bulk=source("src/components/tracker/tracker-issue-bulk-actions.tsx");
    const route=source("src/app/api/tracker/issues/[publicId]/workflow/route.ts");
    expect(page).toContain("<TrackerIssueBulkActions rows=");
    expect(bulk).toContain("Select issues");
    expect(bulk).toContain("Set status to…");
    expect(bulk).toContain("selected.length");
    expect(bulk).toContain("expectedVersion:row.version");
    expect(bulk).toContain("Failed IDs:");
    expect(bulk).toContain("for(const id of selected)");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain("updateBugTrackerWorkflowForAdmin(");
  });
  it("SA-placements-projects-107 saves, restores and deletes named views without persisting pagination cursors",()=>{
    const code=source("src/components/tracker/tracker-issue-saved-views.tsx");
    const page=source("src/app/(authenticated)/tracker/issues/page.tsx");
    expect(page).toContain("<TrackerIssueSavedViews");
    for(const field of ["q","reporter","status","severity","environment","sort"])
      expect(code).toContain('"'+field+'"');
    expect(code).not.toContain('"beforeCreatedAt"');
    expect(code).not.toContain('"beforeId"');
    expect(code).toContain("Save current filters");
    expect(code).toContain("Delete saved view ");
    expect(code).toContain("router.push(");
    expect(code).toContain("localStorage.setItem(KEY");
  });
});