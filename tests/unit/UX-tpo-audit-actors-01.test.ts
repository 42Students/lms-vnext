import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/audit/actors/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-audit-actors-01 /tpo/audit/actors",()=>{
  it("preserves legacy UI while applying signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-[#26bac7]");
    expect(source).not.toContain("text-on-primary");
    expect(source).toContain("min-h-11");
    expect(source).toContain("md:min-h-9");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
