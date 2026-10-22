import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/messages/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-messages-05",()=>{
 it("renders one accessible responsive inbox, preserving all status and link facts",()=>{
  expect(source).toContain('aria-label="Recruiter conversations"');
  expect(source).toContain('aria-label="Recruiter inbox"');
  expect(source).toContain('role="log"');
  expect(source).toContain('items.map(item=><li key={item.id}>');
  expect(source).toContain("No conversations match this search");
  for(const phrase of ["Waiting for you","Access ended","unread","Open full conversation","General conversation"])expect(source).toContain(phrase);
  expect(source).not.toContain("<table");
 });
});
