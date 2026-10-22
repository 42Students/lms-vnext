import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/announcements/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-announcements-01 /tpo/announcements",()=>{
  it("preserves legacy UI while applying signed-off phone and contrast contracts",()=>{
    // A semantic primary glyph is permitted; the legacy text links use the
    // configured LMS link token and retain readable focus treatment.
    expect(source).toContain('text-[var(--lms-link-text)]');
    expect(source).not.toContain("text-on-primary");
    expect(source).toContain('min-h-11');
    expect(source).not.toContain("<main");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
