import { readFileSync as __uiRead } from "node:fs";
const __ui=(f:string)=>__uiRead("src/components/ui/"+f,"utf8");
const __fmt=()=>__uiRead("src/lib/format-date.ts","utf8");
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/announcements/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-announcements-01 /tpo/announcements",()=>{
  it("preserves legacy UI while applying signed-off phone and contrast contracts",()=>{
    // A semantic primary glyph is permitted; the legacy text links use the
    // configured LMS link token and retain readable focus treatment.
    expect(source).toMatch(/text-\[var\(--lms-link-text\)\]|<(?:TextLink|ButtonLink|Pagination|PageBackLink)\b/),expect(__ui("text-link.tsx")).toContain("--lms-link-text");
    expect(source).not.toContain("text-on-primary");
    expect(source).toContain('min-h-11');
    expect(source).not.toContain("<main");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
