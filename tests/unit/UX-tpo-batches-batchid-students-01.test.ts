import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-batches-batchid-students-01 /tpo/batches/[batchId]/students",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-primary-text");
    expect(source).not.toContain("text-on-primary");
    expect(source).not.toMatch(/(?<![a-z-])min-h-(?:9|10)\b/);
    expect(source).toContain("min-h-11");
    expect(source).not.toContain("<main");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
