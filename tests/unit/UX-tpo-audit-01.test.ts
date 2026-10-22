import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/audit/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-audit-01 /tpo/audit",()=>{
  it("preserves legacy UI while applying signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-primary-text");
    expect(source).toContain("text-on-primary");
    expect(source).toContain("bg-primary");
    expect(source).toContain("min-h-11");
    expect(source).toContain("md:min-h-9");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
