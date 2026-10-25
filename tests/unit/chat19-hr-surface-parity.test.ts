import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");
const hr = "src/app/(authenticated)/hr/";

describe("NORTH-STAR chat-19: legacy recruiter page canvas", () => {
  it("keeps the source-backed Today prototype rather than nested generic cards", () => {
    const text = source(hr + "home/page.tsx");
    expect(text).toContain("<RecruiterTodayPrototype");
    const view = source("src/components/hr/recruiter-today-prototype.tsx");
    expect(view).toContain('aria-label="Needs you"');
    expect(view).toContain('aria-label="This week"');
    expect(view).toContain('aria-label="Waiting on the placement cell"');
    expect(view).not.toContain('<section className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-5">');
  });

  it("uses a single old-LMS counter strip for calendar and company reports", () => {
    const calendar = source(hr + "calendar/page.tsx");
    const reports = source(hr + "company/reports/page.tsx");
    expect(calendar).toContain('aria-label="Calendar period navigation"');
    expect(calendar).toContain('aria-label="Filter recruiter calendar"');
    expect(calendar).toContain('data-testid="recruiter.calendar.range"');
    expect(reports).toContain('<SummaryStrip label="Hiring portfolio summary"');
    expect(reports).toContain('{label:"Published drives",value:summary.published}');
    expect(reports).toContain('{label:"Closed drives",value:summary.closed}');
  });

  it("keeps proposal rows on the table-like hairlines", () => {
    const text = source(hr + "drives/proposals/page.tsx");
    expect(text).toContain('<HrProposalHistoryGrid');
    expect(source("src/components/hr/hr-proposal-history-grid.tsx")).toContain("<TpoGrid");
    expect(text).toContain('<HrProposalHistoryGrid');
    expect(text).toContain('aria-label="Search sent drive proposals"');
    expect(text).not.toContain('className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-4"');
  });

  it("uses shared Input Select Button chrome for proposal filters", () => {
    const text = source(hr + "drives/proposals/page.tsx");
    expect(text).toContain('import {Input} from "@/components/ui/input";');
    expect(text).toContain('import {Select} from "@/components/ui/select";');
    expect(text).toContain('<Input name="q" type="search"');
    expect(text).toContain('<Select name="sort"');
    expect(text).toContain('</Select>');
    expect(text).toContain('<Button type="submit" variant="secondary"');
    expect(text).not.toContain('<select name="sort"');
  });

  it("uses shared form controls for recruiter hiring round creation and editing", () => {
    const rounds = source(hr + "drives/[jobId]/rounds/editor/page.tsx");
    const remove = source(hr + "drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx");
    expect((rounds.match(/<Input\b/g) ?? []).length).toBe(7);
    expect(rounds).toContain('<Input type="hidden" name="expectedUpdatedAt" value={round.updatedAt.toISOString()}');
    expect((rounds.match(/<Select\b/g) ?? []).length).toBe(4);
    expect((rounds.match(/<\/Select>/g) ?? []).length).toBe(4);
    expect((rounds.match(/<Button\b/g) ?? []).length).toBe(2);
    expect(rounds).not.toContain("<select ");
    expect(rounds).not.toContain("<button type=\"submit\"");
    expect(remove).toContain('<Button type="submit" variant="danger"');
    expect(remove).toContain("</Button>");
  });

  it("keeps the mobile drawer icon-only triggers with balanced SVG markup", () => {
    const text = source("src/components/shell/mobile-navigation.tsx");
    expect(text).not.toContain('aria-hidden="true">☰');
    expect(text).not.toContain('aria-hidden="true">×');
    expect((text.match(/<svg\b/g) ?? []).length).toBe(1);
    expect((text.match(/<\/svg>/g) ?? []).length).toBe(1);
    expect(text).toContain('onOpenChange={setOpen}');
    expect(text).toContain('bodyClassName="!px-[var(--lms-space-3)]');
    expect(text).toContain('<SidebarNav items={items} onNavigate={() => setOpen(false)}');
  });
});
