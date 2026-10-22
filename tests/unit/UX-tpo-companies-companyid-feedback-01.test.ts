import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-companyid-feedback-01 /tpo/companies/[companyId]/feedback",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-primary-text");
    expect(source).not.toContain("text-on-primary");
    expect(source).not.toMatch(/(?<!md:|sm:|lg:)min-h-(?:9|10)\b/);
    expect(source).toContain("min-h-11");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
