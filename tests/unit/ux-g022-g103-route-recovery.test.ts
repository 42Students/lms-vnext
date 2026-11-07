import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

describe("UX-G022 — project template route recovery and privacy", () => {
  it("keeps every task/version/create error recoverable without guessing a template identifier", () => {
    const entries = [
      "src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/error.tsx",
      "src/app/(authenticated)/admin/projects/templates/[templateId]/versions/error.tsx",
      "src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/error.tsx",
      "src/app/(authenticated)/admin/projects/templates/new/error.tsx",
    ];
    for (const path of entries) {
      const file = source(path);
      expect(file).toContain("<GracefulErrorBoundary error={error} reset={reset} />");
      expect(file).toContain('href="/admin/projects/templates"');
      expect(file).toContain("Back to project templates");
    }
  });
  it("labels slow task, history, comparison and creation states", () => {
    const base = "src/app/(authenticated)/admin/projects/templates/";
    for (const path of [
      "[templateId]/tasks/loading.tsx",
      "[templateId]/versions/loading.tsx",
      "[templateId]/versions/[versionId]/loading.tsx",
      "new/loading.tsx",
    ]) {
      const file = source(base + path);
      expect(file).toMatch(/Loading|loading/);
      expect(file).toContain("aria-busy");
    }
    const version = source(base + "[templateId]/versions/page.tsx");
    expect(version).toContain('z.uuid().safeParse(templateId)');
    const create = source(base + "new/page.tsx");
    expect(create).toContain('can(ctx,"project-template.manage")');
    expect(create).toContain("<SuperAdminTemplateCreateForm");
  });
});

describe("UX-G103 — TPO operational route filter recovery", () => {
  it("does not accept ambiguous finder searches and offers a safe reset", () => {
    const sourceText = source("src/app/(authenticated)/tpo/find/page.tsx");
    expect(sourceText).toContain("Array.isArray(raw.q)");
    expect(sourceText).toContain("Clear invalid search");
    expect(sourceText).toContain('href="/tpo/find"');
    expect(sourceText).toContain("requireTpoBatchActor(ctx)");
  });
  it("rejects invalid follow-up filters before querying the college queue", () => {
    const sourceText = source("src/app/(authenticated)/tpo/follow-ups/page.tsx");
    expect(sourceText).toContain("FOLLOWUP_SCOPES.some");
    expect(sourceText).toContain("FOLLOWUP_WINDOWS.some");
    expect(sourceText).toContain("raw.q.trim().length>100");
    expect(sourceText).toContain("Clear filters");
    expect(sourceText).toContain("getTpoDueFollowupQueue(context");
  });
  it("rejects duplicate home filters and does not infer attendance absence", () => {
    const home = source("src/app/(authenticated)/tpo/home/page.tsx");
    expect(home).toContain("Array.isArray(routeQuery.seasonId)");
    expect(home).toContain("Invalid placement home filters");
    expect(home).toContain('href="/tpo/home"');
    expect(home).toContain("hasTpoTooling(ctx)");
    const noShows = source("src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx");
    expect(noShows).toContain("buildTpoNoShowReport(data.rows)");
    expect(noShows).toContain('requirePermission(context, "placements.manage"');
    expect(noShows).toContain("Only explicitly marked ABSENT");
    expect(source("src/app/(authenticated)/tpo/home/loading.tsx")).toContain('aria-busy="true"');
  });
});
