import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const hr = "src/app/(authenticated)/hr/";

describe("NORTH-STAR-CHAT19: recruiter legacy navigation and controls", () => {
  it("renders distinct active and inactive underlined conversation filters", () => {
    const source = read(hr + "conversations/page.tsx");
    expect(source).toContain('aria-label="Conversation kind"');
    expect(source).toContain('aria-label="Conversation status"');
    expect(source).toContain("parsed.data.scope===item.value ?");
    expect(source).toContain('parsed.data.unreadOnly==="true" ?');
    expect(source).toContain("border-b-[3px] border-primary");
    expect(source).toContain("border-b-[3px] border-transparent");
    expect(source).not.toContain('className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-primary-text');
  });

  it("uses a 9px legacy control radius for selected employer colleges", () => {
    for (const route of ["company/page.tsx", "company/reports/page.tsx", "home/page.tsx", "drives/page.tsx"]) {
      const source = read(hr + route);
      expect(source, route).toContain("rounded-[var(--lms-control-radius)]");
      expect(source, route).not.toMatch(/rounded-full (?:bg-primary|border border-border bg-surface px-[34] py-[12]|border border-border px-3 py-2)/);
    }
    const company = read(hr + "company/page.tsx");
    expect(company).toContain('aria-current={grant.collegeId === result.grant.collegeId ? "page" : undefined}');
  });

  it("keeps the recruiter notification bell focus at the measured teal outline", () => {
    const bell = read("src/components/hr/hr-recruiter-bell.tsx");
    expect(bell).not.toContain("focus-visible:outline-primary disabled:opacity-50");
    expect(bell).toContain("focus-visible:outline-[var(--lms-primary)] disabled:opacity-50");
  });
});
