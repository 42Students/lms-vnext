import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-drive-day-roundid-no-shows-01 /tpo/drive-day/[roundId]/no-shows",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-primary-text");
    // High-contrast foreground is correct when paired with a primary background.
    expect(source).toContain("border-primary bg-primary");
    expect(source).toContain("text-on-primary");
    expect(source).toContain("min-h-11");
    expect(source).toContain("md:min-h-9");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
