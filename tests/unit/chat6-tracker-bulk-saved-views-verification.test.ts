import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

describe("Chat-6 tracker issue list parity", () => {
  it("SA-placements-projects-106 bulk status changes preserve per-issue version guards and partial failure reporting", () => {
    const page = source("src/app/(authenticated)/tracker/issues/page.tsx");
    const bulk = source("src/components/tracker/tracker-issue-bulk-actions.tsx");
    expect(page).toContain("<TrackerIssueBulkActions");
    expect(page).toContain("version:issue.version");
    expect(bulk).toContain("Select issues");
    expect(bulk).toContain("Select this page");
    expect(bulk).toContain("Set status to…");
    expect(bulk).toContain("selected.length");
    expect(bulk).toContain("if(lock.current||!selected.length)return");
    expect(bulk).toContain("method:\"PATCH\"");
    expect(bulk).toContain("expectedVersion:row.version");
    expect(bulk).toContain("failures.push(id)");
    expect(bulk).toContain("Failed IDs:");
    expect(bulk).toContain("router.refresh()");
  });

  it("SA-placements-projects-107 safely saves, applies and removes bounded browser-only filter presets", () => {
    const page = source("src/app/(authenticated)/tracker/issues/page.tsx");
    const views = source("src/components/tracker/tracker-issue-saved-views.tsx");
    expect(page).toContain("<TrackerIssueSavedViews");
    expect(views).toContain('const FIELDS=["q","reporter","status","severity","environment","sort"]');
    expect(views).toContain("filterOnlyIssuesView(filters)");
    expect(views).toContain("new URLSearchParams(search)");
    expect(views).toContain("value.length<=120");
    expect(views).toContain("item.name.length<=60");
    expect(views).toContain("item.filters.length<=500");
    expect(views).toContain("views.length>=12");
    expect(views).toContain("window.localStorage.setItem");
    expect(views).toContain('router.push("/tracker/issues"');
    expect(views).toContain("Delete saved view");
  });
});
