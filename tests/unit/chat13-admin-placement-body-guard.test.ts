import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {readAdminPlacementJson} from "@/modules/placements/admin-request-body-model";

const input=(body:string,headers:Record<string,string>={})=>
  new Request("https://local.invalid/placements/admin",{
    method:"PATCH",body,headers,
  });

describe("SA-ADMIN-BODY-16 actual-byte-limited Super Admin mutation payloads",()=>{
 it("round-trips a valid editable payload without coercing its fields",async()=>{
  const value={confirmed:true,reason:"Review change",description:"Current drive details"};
  expect(await readAdminPlacementJson(input(JSON.stringify(value)),32768))
   .toEqual({ok:true,value});
 });
 it("rejects malformed, absent, forged-size and streamed over-limit input",async()=>{
  expect(await readAdminPlacementJson(input('{"bad":'),4096))
   .toEqual({ok:false});
  expect(await readAdminPlacementJson(input("{}",{"content-length":"99999"}),4096))
   .toEqual({ok:false});
  expect(await readAdminPlacementJson(input("{}",{"content-length":"not-an-integer"}),4096))
   .toEqual({ok:false});
  expect(await readAdminPlacementJson(input(JSON.stringify({
    description:"x".repeat(5000),
  }),{"content-length":"2"}),4096)).toEqual({ok:false});
  expect(await readAdminPlacementJson(input("{}"),0)).toEqual({ok:false});
 });
 it("protects both route mutations after same-origin but before authentication",()=>{
  for(const path of [
   "src/app/api/admin/placements/platform-policy/route.ts",
   "src/app/api/admin/placements/jobs/[jobId]/edit-published/route.ts",
  ]){
   const fullSource=readFileSync(path,"utf8");
   // route() runs origin -> authentication before the handler, so the bounded body read happens inside the
   // handler only for an authenticated, same-origin caller. The route may also hold a read-only GET above.
   expect(fullSource).toContain('from "@/security/route"');
   const mutationStart=fullSource.search(/export const (PUT|PATCH)\s*=\s*route\(/);
   expect(mutationStart).toBeGreaterThanOrEqual(0);
   const s=fullSource.slice(mutationStart);
   expect(s).toMatch(/auth:\s*"user"/);
   expect(s).not.toMatch(/csrf:\s*false/);
   expect(s).toContain("readAdminPlacementJson(request,");
   expect(s).toContain('error:"INVALID_REQUEST"');
  }
 });
});
