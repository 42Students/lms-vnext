import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-companyid-people-01 /tpo/companies/[companyId]/people",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-primary-text");
    expect(source).not.toContain("text-on-primary");
    expect(source).toContain("min-h-11");
    expect(source).toContain("md:min-h-9");
    expect(source).toContain("focus-visible:outline-2");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
