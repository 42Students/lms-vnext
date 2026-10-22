import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const read=(path:string)=>readFileSync(path,"utf8");

describe("G2-11-008-048: TPO drive-day last-good roster refresh",()=>{
 it("checks the selected round every 20 seconds without discarding the loaded roster on failure",()=>{
  const client=read("src/components/placements/tpo-round-drive-day-read-only.tsx");
  expect(client).toContain('},20_000)');
  expect(client).toContain('const controller=new AbortController()');
  expect(client).toContain('if(response.status!==204)throw new Error("ROSTER_REFRESH_UNAVAILABLE")');
  expect(client).toContain('setStaleSnapshot(true)');
  expect(client).toContain('setRefreshFailed(true)');
  expect(client).toContain("Showing the last loaded details");
  expect(client).toContain('headers:{Accept:"application/json"},signal:controller.signal');
  expect(client).toContain('controller.abort()');
  expect(client).toContain('if(!controller.signal.aborted)');
 });
 it("permits refresh only after authenticated TPO permission and an authorized scoped roster read",()=>{
  const route=read("src/app/api/placements/tpo/drive-day/[roundId]/refresh/route.ts");
  expect(route).toContain('hasMembershipRole(context,"TPO")');
  expect(route).toContain('requirePermission(context,"placements.manage"');
  expect(route).toContain('placementRoundIdSchema.parse(roundId)');
  expect(route).toContain('await getTpoRoundDriveDay(context,placementRoundIdSchema.parse(roundId))');
  expect(route).toContain('new Response(null,{status:204');
  expect(route).toContain('"Cache-Control":"private, no-store, max-age=0"');
  expect(route).not.toContain('request.json()');
 });
});
