import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO private Team context fidelity",()=>{
 it("TPO-inbox-team-26 shows actual open asks, decisions, participants and declared absence",()=>{
  const page=source("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  const panel=source("src/components/tpo/tpo-team-thread-details.tsx");
  expect(page).toContain("asks.items.filter(ask=>ask.status===\"OPEN\").length");
  expect(page).toContain("awayLabel={awayLabel}");
  expect(page).toContain("decisions={result.messages.filter");
  for(const label of ["Decisions here","Open asks","People","About this conversation","Details"])
   expect(panel).toContain(label);
  expect(panel).toContain("away until");
 });
 it("TPO-inbox-team-26 remembers its Details choice without inferring company/student data",()=>{
  const panel=source("src/components/tpo/tpo-team-thread-details.tsx");
  expect(panel).toContain("sessionStorage.getItem(storageKey)");
  expect(panel).toContain("sessionStorage.setItem(storageKey");
  expect(panel).toContain('aria-label="Conversation details"');
  expect(panel).toContain("Only this conversation");
 });
});