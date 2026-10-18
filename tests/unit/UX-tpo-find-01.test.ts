import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/find/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-find-01 /tpo/find",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-primary-text");
    expect(source).not.toContain("text-on-primary");
    expect(source).not.toMatch(/min-h-(?:9|10)\b/);
    expect(source).not.toContain("<main");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
