import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");
const hr = "src/app/(authenticated)/hr/";

describe("NORTH-STAR chat-19: legacy recruiter page canvas", () => {
  it("separates Today sections using dividers rather than nested full-size cards", () => {
    const text = source(hr + "home/page.tsx");
    expect(text).toContain('aria-label="Next recruiter actions"');
    expect(text).toContain('aria-label="Recruiter tasks" className="grid overflow-hidden rounded-[var(--lms-radius-card)] border border-border sm:grid-cols-2 xl:grid-cols-5"');
    expect(text).toContain('aria-label="Live recruiter hiring drives" className="border-b border-border pb-5"');
    expect(text).not.toContain('<section className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-5">');
    expect(text).toContain('className="border-b border-border pb-5"');
  });

  it("uses a single old-LMS counter strip for calendar and company reports", () => {
    const calendar = source(hr + "calendar/page.tsx");
    const reports = source(hr + "company/reports/page.tsx");
    expect(calendar).toContain('aria-label="Recruiter calendar summary"');
    expect(calendar).toContain('xl:grid-cols-5');
    expect(reports).toContain('aria-label="Hiring portfolio summary"');
    expect(reports).toContain('className="border-b border-border p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"');
  });

  it("keeps proposal rows on the table-like hairlines", () => {
    const text = source(hr + "drives/proposals/page.tsx");
    expect(text).toContain('className="divide-y divide-border border-y border-border"');
    expect(text).toContain('className="p-4"');
    expect(text).not.toContain('className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-4"');
  });

  it("uses shared Input Select Button chrome for proposal filters", () => {
    const text = source(hr + "drives/proposals/page.tsx");
    expect(text).toContain('import {Input} from "@/components/ui/input";');
    expect(text).toContain('import {Select} from "@/components/ui/select";');
    expect(text).toContain('<Input name="q"');
    expect(text).toContain('<Select name="sort"');
    expect(text).toContain('</Select>');
    expect(text).toContain('<Button type="submit" variant="secondary"');
    expect(text).not.toContain('<select name="sort"');
  });

  it("uses shared form controls for recruiter hiring round creation and editing", () => {
    const rounds = source(hr + "drives/[jobId]/rounds/editor/page.tsx");
    const remove = source(hr + "drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx");
    expect((rounds.match(/<Input\b/g) ?? []).length).toBe(3);
    expect((rounds.match(/<Select\b/g) ?? []).length).toBe(4);
    expect((rounds.match(/<\/Select>/g) ?? []).length).toBe(4);
    expect((rounds.match(/<Button\b/g) ?? []).length).toBe(2);
    expect(rounds).not.toContain("<select ");
    expect(rounds).not.toContain("<button type=\"submit\"");
    expect(remove).toContain("<Button type=\"submit\">");
    expect(remove).toContain("</Button>");
  });

  it("keeps the mobile drawer icon-only triggers with balanced SVG markup", () => {
    const text = source("src/components/shell/mobile-navigation.tsx");
    expect(text).not.toContain('aria-hidden="true">☰');
    expect(text).not.toContain('aria-hidden="true">×');
    expect((text.match(/<svg\b/g) ?? []).length).toBe(2);
    expect((text.match(/<\/svg>/g) ?? []).length).toBe(2);
    expect(text).toContain("min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-2 pb-4");
  });
});
