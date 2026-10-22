import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/drive-day/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-drive-day-01 /tpo/drive-day",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-[#26bac7]");
    expect(source).not.toContain("text-on-primary");
    expect(source).not.toMatch(/(?:^|[\s"'\x60])min-h-(?:9|10)\b/);
    expect(source).toContain("min-h-11");
    expect(source).toContain("min-[768px]:min-h-[var(--lms-control-height)]");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
