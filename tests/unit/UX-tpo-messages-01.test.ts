import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/messages/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-messages-01 /tpo/messages",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).toContain("bg-primary-subtle text-primary-text");
    expect(source).not.toContain("text-on-primary");
    expect(source).not.toContain("min-h-10");
    expect(source).toContain("min-h-11");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
