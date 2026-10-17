import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Team conversation context panel",()=>{
 it("TPO-inbox-team-26 displays only authorized private thread facts and real decision count",()=>{
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  const details=src("src/components/tpo/tpo-team-thread-details.tsx");
  expect(page).toContain("<TpoTeamThreadDetails");
  expect(page).toContain("result.thread.counterpartName");
  expect(page).toContain("result.messages.filter(message=>message.decision&&!message.removed).length");
  expect(details).toContain("About this conversation");
  expect(details).toContain("Decisions here");
  expect(details).not.toContain("companyId");
 });
 it("TPO-inbox-team-42 makes Details collapsible on phones and saves state per browser thread",()=>{
  const details=src("src/components/tpo/tpo-team-thread-details.tsx");
  expect(details).toContain('sessionStorage.getItem(storageKey)');
  expect(details).toContain('sessionStorage.setItem(storageKey');
  expect(details).toContain("aria-expanded={open}");
  expect(details).toContain('aria-label="Conversation details"');
  expect(details).toContain("lg:max-w-md");
 });
});
