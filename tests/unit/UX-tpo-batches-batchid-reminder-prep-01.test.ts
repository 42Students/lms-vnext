import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-batches-batchid-reminder-prep-01 /tpo/batches/[batchId]/reminder-prep",()=>{
  it("preserves canonical destination",()=>{
    expect(source).toContain("redirect(");
  });
});
