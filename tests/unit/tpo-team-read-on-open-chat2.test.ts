import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
describe("TPO Team opens as read without GET mutations",()=>{
 it("TPO-inbox-team-R05 acknowledges Team on opening using a guarded explicit POST",()=>{
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  const action=src("src/components/tpo/tpo-team-open-read.tsx");
  const route=src("src/app/api/placements/tpo/team/threads/[threadId]/acknowledge/route.ts");
  expect(page).toContain("<TpoTeamOpenRead threadId={result.thread.id}/>");
  expect(action).toContain('method:"POST"');
  expect(action).toContain("timeoutMs:12000");
  expect(action).toContain("if(active)router.refresh()");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain('request.headers.get("accept")?.includes("application/json")');
  expect(route).toContain("NextResponse.json(result)");
 });
 it("TPO-inbox-team-20 leaves manual retry available when the read pointer cannot be saved",()=>{
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  const action=src("src/components/tpo/tpo-team-open-read.tsx");
  expect(page).toContain("Mark this conversation&apos;s alerts as read");
  expect(action).toContain("Use the button below to retry.");
  expect(action).toContain('role="alert"');
 });
});
