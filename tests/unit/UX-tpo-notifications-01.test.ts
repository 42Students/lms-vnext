import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/notifications/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-notifications-01 /tpo/notifications",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).toContain("text-primary-text");
    expect(source).toContain("focus-visible:outline-2");
    expect(source).not.toContain("text-on-primary");
    expect(source).not.toMatch(/min-h-(?:9|10)\b/);
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
