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
  expect(service).toContain("hasMore=safePage*100<totalCount");
  expect(service).toContain("const visibleItems=items.slice(0,100)");
  expect(service).toContain("eq(tpoInternalThreads.collegeId,college.id)");
 });
 it("TPO-inbox-team-18 preserves filter and search when fetching older conversations",()=>{
  const page=src("src/app/(authenticated)/tpo/messages/page.tsx");
  const directory=src("src/components/tpo/tpo-team-messages-directory.tsx");
  expect(page).toContain("<TpoTeamMessagesDirectory context={context}");
  expect(page).toContain("page={/^[1-9]\\d{0,3}$/.test(first(raw.page)");
  expect(directory).toContain("listMyTpoInternalThreads(context,safeQuery,safePage,");
  expect(directory).toContain('aria-label="Team conversation pages"');
  expect(directory).toContain("href(undefined,view,safePage+1)");
  expect(directory).toContain('params.set("q",safeQuery)');
  expect(directory).toContain('params.set("filter",nextFilter)');
  expect(directory).toContain('params.set("page",String(nextPage))');
 });
});
