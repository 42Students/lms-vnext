import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/messages/[threadId]/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-messages-threadid-02",()=>{
 it("uses the audited shared PageHeader and keeps existing actions",()=>{
  expect(source).toContain("<PageHeader");
  expect(source).not.toContain("<h1");
 });
});
