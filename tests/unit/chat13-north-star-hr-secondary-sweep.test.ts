import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (name: string) =>
  readFileSync("src/app/(authenticated)/hr/" + name + "/page.tsx", "utf8");

describe("chat-13 NORTH STAR adjacent HR portal shared form chrome", () => {
  it("reuses the shared Select/Button on employer-scoped drives", () => {
    const s = source("drives");
    expect(s).toContain('from "@/components/ui/select"');
    expect(s).toContain('from "@/components/ui/button"');
    expect(s).toContain('from "@/components/ui/input"');
    expect(s).toContain("<RecruiterDriveLiveSearch");
    for (const field of ["employment", "mode", "deadline", "sort"])
      expect(s).toContain('<Select name="' + field + '"');
    expect(s).toContain('<Button type="submit" variant="secondary"');
    expect(s).not.toContain("<select ");
    expect(s).toContain('name="collegeId"');
  });
  it("keeps employer conversations' GET+POST workflows while normalizing controls", () => {
    const s = source("conversations");
    expect(s).toContain('<Select name="sort"');
    expect(s).toContain('<Input name="q"');
    expect(s).toContain('<Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Send message</Button>');
    expect(s).toContain('Mark visible unread conversations as read');
    expect(s).toContain('action="/api/placements/recruiter/conversations/acknowledge"');
    expect(s).toContain('action="/api/placements/recruiter/conversations/open"');
  });
  it("keeps read-only bell inbox searching, and company team and reports forms", () => {
    const notifications = source("notifications");
    expect(notifications).toContain('<Input id="hr-notification-search"');
    expect(notifications).toContain('<Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>');
    const company = source("company");
    expect(company).toContain('<Input id="hr-team-query"');
    expect(company).toContain('<Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>');
    expect(company).not.toContain("bg-surface-secondary");
    const thread = source("conversations/[threadId]");
    expect(thread).not.toContain("bg-surface-subtle");
    const reports = source("company/reports");
    expect(reports).toContain('<Select');
    expect(reports).toContain('<Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply filters</Button>');
    expect(reports).not.toContain("<select");
  });
});
