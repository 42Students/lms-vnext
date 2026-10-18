import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-batches-batchid-rules-02",()=>{
 it("uses the audited shared PageHeader and keeps existing actions",()=>{
  expect(source).toContain("<PageHeader");
  expect(source).not.toContain("<h1");
 });
});
