import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/messages/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-messages-04",()=>{
 it("uses shared controls in existing authorized GET workflow",()=>{
  // GET controls belong to the scoped Team/Recruiter inbox components,
  // not to a second copy of the form in the server route.
  expect(source).toContain("TpoTeamMessagesDirectory context={context}");
  expect(source).toContain("<TpoInboxSearch");
  expect(source).toContain("<TpoNewRecruiterConversation");
  const search=readFileSync(new URL("../../src/components/tpo/tpo-inbox-search.tsx",import.meta.url),"utf8");
  expect(search).toContain("<Input");
  expect(source).toContain("<PageHeader");
 });
});
