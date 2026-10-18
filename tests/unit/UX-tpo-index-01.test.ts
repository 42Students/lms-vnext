import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-index-01 /tpo",()=>{
  it("preserves the canonical in-app redirect",()=>{
    expect(source).toContain("redirect(");
  });
});
