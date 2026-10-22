import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Recruiter profile failure recovery", () => {
  it("preserves selected college scope while keeping Retry available", () => {
    const source = readFileSync("src/app/(authenticated)/hr/profile/page.tsx", "utf8");
    expect(source).toContain("Promise.allSettled([");
    expect(source).toContain('title="We couldn\'t load your profile"');
    expect(source).toContain('const retryHref = scopedCollegeId');
    expect(source).toContain('"/hr/profile?collegeId=" + encodeURIComponent(scopedCollegeId)');
    expect(source).toContain("<Link href={retryHref}");
    expect(source).toContain(">Retry</Link>");
  });
});
