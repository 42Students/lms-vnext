import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const hr = "src/app/(authenticated)/hr/";

describe("NORTH-STAR-CHAT19: recruiter legacy navigation and controls", () => {
  it("renders distinct active and inactive underlined conversation filters", () => {
    const source = read(hr + "conversations/page.tsx");
    const tabs=read("src/components/ui/tabs.tsx");
    expect(source).toContain("<Tabs");
    expect(tabs).toContain("ariaLabel");
    expect(tabs).toContain('aria-current={item.value === value ? "page" : undefined}');
    expect(tabs).toContain("after:h-[3px]");
    expect(tabs).toContain("after:w-0 after:-translate-x-1/2");
    expect(tabs).toContain("aria-[current=page]:after:w-full aria-[current=page]:after:opacity-100");
    expect(tabs).toContain("aria-selected:after:w-full aria-selected:after:opacity-100");
    expect(tabs).toContain("border-transparent");
    expect(source).not.toContain('className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-primary-text');
  });

  it("uses a 9px legacy control radius for selected employer colleges", () => {
    for (const route of ["company/page.tsx", "company/reports/page.tsx", "home/page.tsx", "drives/page.tsx"]) {
      const source = read(hr + route);
      expect(source, route).toContain("rounded-[var(--lms-control-radius)]");
      expect(source, route).not.toMatch(/rounded-full (?:bg-primary|border border-border bg-surface px-[34] py-[12]|border border-border px-3 py-2)/);
    }
    const company = read(hr + "company/page.tsx");
    expect(company).toContain("selectedKey={result.grant.collegeId}");
    expect(read("src/components/ui/needs-doing-chips.tsx")).toContain('aria-current={selected ? "page" : undefined}');
  });

  it("keeps the recruiter notification bell focus at the measured teal outline", () => {
    const bell = read("src/components/hr/hr-recruiter-bell.tsx");
    expect(bell).not.toContain("focus-visible:outline-primary disabled:opacity-50");
    expect(bell).toContain('data-testid="recruiter.notification-bell"');
    expect(bell).toContain("!h-11 !w-11 !min-w-11");
    expect(read("src/components/ui/button.tsx")).toContain("focus-visible:outline");
  });
});
