import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/placements/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-placements-01 /tpo/placements",()=>{
  it("preserves canonical destination",()=>{
    expect(source).toContain("redirect(");
  });
});
