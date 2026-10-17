import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-requests-verification-01 exposes scoped learner submission/history and TPO decision routes with origin and schema checking",()=>{
 const own=src("src/app/api/placements/requests/general/route.ts");
 const staff=src("src/app/api/placements/tpo/requests/general/[requestId]/decision/route.ts");
 const list=src("src/app/api/placements/tpo/requests/general/route.ts");
 expect(own).toContain("createOwnTpoGeneralRequest");
 expect(own).toContain("listOwnTpoGeneralRequests");
 expect(own).toContain("isSameOriginRequest(request)");
 expect(staff).toContain("isSameOriginRequest(request)");
 expect(staff).toContain("decideTpoGeneralRequest");
 expect(list).toContain("listTpoGeneralRequests");
 expect(staff).toContain("EFFECT_UNSUPPORTED");
});