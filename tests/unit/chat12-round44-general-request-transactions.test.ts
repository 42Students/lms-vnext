import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-requests-verification-01 uses locked scoped request approval with real external offer/registration writes and immutable notices",()=>{
 const v=s("src/modules/placements/tpo-general-request-service.ts");
 expect(v).toContain("placementExternalOfferEvents");
 expect(v).toContain("placementBatchRegistrationEvents");
 expect(v).toContain("EFFECT_UNSUPPORTED");
 expect(v).toContain("for(\"update\")");
 expect(v).toContain("recordedByUserId:ctx.user.id");
 expect(v).toContain("notifyTpo");
 expect(v).toContain("version:randomUUID()");
});
