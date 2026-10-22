import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/batches/[batchId]/classes/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-batches-batchid-classes-01 /tpo/batches/[batchId]/classes",()=>{
  it("preserves legacy UI while applying signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-primary-text");
    expect(source).not.toContain("text-on-primary");
    expect(source).toContain("min-h-11");
    expect(source).toContain("md:min-h-9");
    expect(source).toContain("focus-visible:outline-2");
    expect(source).not.toContain("<main");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
