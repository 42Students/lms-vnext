import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/calendar/export/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-calendar-export-01 /tpo/calendar/export",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-[#26bac7]");
    expect(source).not.toContain("text-on-primary");
    expect(source).toContain("min-h-11");
    expect(source).not.toMatch(/(?:^|[\s"])min-h-(?:9|10)\b/);
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
