import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("TPO-inbox-team-19 Team search implementation",()=>{
 it("TPO-inbox-team-19 searches only the caller's authorized Team threads and message bodies",()=>{
  const service=read("src/modules/placements/tpo-team-internal-read-service.ts");
  expect(service).toContain('const q=search.length>=2?search:""');
  expect(service).toContain("eq(tpoInternalThreads.collegeId,college.id)");
  expect(service).toContain("eq(tpoInternalThreads.startedByMembershipId,membership.id)");
  expect(service).toContain("eq(tpoInternalThreads.invitedMembershipId,membership.id)");
  expect(service).toContain("m.college_id=${college.id}::uuid");
  expect(service).toContain("position(lower(${q}) in lower(m.body))>0");
  expect(service).toContain("searchSnippet:");
 });
 it("TPO-inbox-team-19 keeps search in the URL, debounces after two characters and supports slash focus",()=>{
  const view=read("src/components/tpo/tpo-team-search.tsx");
  const page=read("src/app/(authenticated)/tpo/team/page.tsx");
  expect(view).toContain('event.key!=="/"');
  expect(view).toContain("query.length>=2");
  expect(view).toContain("},200)");
  expect(view).toContain('router.replace("/tpo/team?"');
  expect(page).toContain("<TpoTeamSearch value={search}/>");
  expect(page).toContain("row.searchSnippet??row.lastPreview");
 });
});
