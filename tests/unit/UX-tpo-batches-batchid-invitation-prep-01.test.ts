import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-batches-batchid-invitation-prep-01 /tpo/batches/[batchId]/invitation-prep",()=>{
  it("preserves the canonical in-app redirect",()=>{
    expect(source).toContain("redirect(");
  });
});
