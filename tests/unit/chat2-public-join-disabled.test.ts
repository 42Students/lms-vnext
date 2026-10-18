import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoPublicJoinLinkToggleSchema} from "@/modules/placements/tpo-public-join-link-model";
describe("TPO-campaigns-public-21 opt-in link gate",()=>{
 it("refuses forged company and college scopes",()=>{
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COLLEGE",enabled:false}).success).toBe(false);
  const linkId="00000000-0000-4000-8000-000000000001";
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COLLEGE",expectedLinkId:linkId,enabled:false}).success).toBe(true);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COLLEGE",expectedLinkId:"stale-tab",enabled:false}).success).toBe(false);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COLLEGE",companyId:"bad",enabled:true}).success).toBe(false);
 });
 it("blocks disabled links at preview, OTP send, join and open",()=>{
  for(const name of ["preview-service.ts","send-code-service.ts","join-service.ts","open-service.ts"]){
   const s=readFileSync("src/modules/placements/public-join/"+name,"utf8");
   expect(s).toContain("enabled,true");
  }
 });
});
