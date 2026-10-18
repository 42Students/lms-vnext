import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/messages/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-messages-05",()=>{
 it("renders one accessible responsive inbox, preserving all status and link facts",()=>{
  expect(source).toContain("<DataTable");
  expect(source).toContain("rows={items}");
  expect(source).toContain("No matching communication records");
  expect(source).toContain('mobilePriority:"action"');
  for(const phrase of ["Waiting for you","Access ended","unread recruiter message records","Open related job","General conversation"])expect(source).toContain(phrase);
  expect(source).not.toContain("<table");
 });
});
