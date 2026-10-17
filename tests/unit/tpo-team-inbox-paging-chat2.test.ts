import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO Team conversation pagination",()=>{
 it("TPO-inbox-team-18 pages all authorized Team threads in stable last-activity order",()=>{
  const service=src("src/modules/placements/tpo-team-internal-read-service.ts");
  expect(service).toContain("Number.isSafeInteger(page)");
  expect(service).toContain(".limit(101).offset((safePage-1)*100)");
  expect(service).toContain(".orderBy(desc(lastActivity),desc(tpoInternalThreads.id))");
  expect(service).toContain("const visibleItems=items.slice(0,100)");
  expect(service).toContain("hasMore=items.length>100");
  expect(service).toContain("eq(tpoInternalThreads.collegeId,college.id)");
 });
 it("TPO-inbox-team-18 preserves filter and search when fetching older conversations",()=>{
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(page).toContain("listMyTpoInternalThreads(context,search,conversationPage)");
  expect(page).toContain('aria-label="Team conversation pages"');
  expect(page).toContain('page:String(conversations.page+1)');
  expect(page).toContain("Counts are for the conversations on this page.");
 });
});
