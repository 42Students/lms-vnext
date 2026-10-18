import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {decideWaitlistReleaseSettlement,tpoWaitlistPromotionSchema} from "@/modules/placements/tpo-waitlist-promotion-model";
const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const service=()=>readFileSync(new URL("../../src/modules/placements/tpo-waitlist-promotion-service.ts",import.meta.url),"utf8");
describe("PLACEMENTS-WAIT-IDEMP-01 / TPO-BREAK-waitlist-race-01",()=>{
 it("only a genuinely pending empty reservation may be written as released",()=>{
  expect(decideWaitlistReleaseSettlement("PENDING",null,A)).toBe("WRITE");
  expect(decideWaitlistReleaseSettlement("PENDING",A,A)).toBe("STALE");
  expect(decideWaitlistReleaseSettlement("PENDING",B,A)).toBe("STALE");
  expect(decideWaitlistReleaseSettlement("RELEASED",null,A)).toBe("STALE");
 });
 it("same offer retry is idempotent; different issued offers or terminal statuses cannot override it",()=>{
  expect(decideWaitlistReleaseSettlement("RELEASED",A,A)).toBe("IDEMPOTENT");
  expect(decideWaitlistReleaseSettlement("RELEASED",B,A)).toBe("STALE");
  for(const status of ["EXPIRED","CANCELLED","REVOKED",""]){
   expect(decideWaitlistReleaseSettlement(status,A,A)).toBe("STALE");
  }
 });
 it("both post-issue reconciliation routes must lock the same promotion row and avoid duplicate audits",()=>{
  const code=service();
  const active=code.slice(code.indexOf("if(active.length){"),code.indexOf("const offer=await issuePlacementOffer("));
  const issued=code.slice(code.indexOf("const offer=await issuePlacementOffer("));
  for(const segment of [active,issued]){
   expect(segment).toContain("decideWaitlistReleaseSettlement(");
   expect(segment).toContain('.for("update").limit(1)');
   expect(segment).toContain('if(decision==="IDEMPOTENT")return;');
   expect(segment).toContain('if(decision==="STALE")throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE")');
   expect(segment.indexOf('if(decision==="IDEMPOTENT")return;')).toBeLessThan(segment.indexOf('status:"RELEASED"'));
  }
  expect(active.indexOf('if(decision==="IDEMPOTENT")return;')).toBeLessThan(active.indexOf("await auditTpoJobChange("));
 });
 it("malformed stale token / forced confirmation bypass still fails strict Zod entry",()=>{
  const expectedPreviewToken="a".repeat(64);
  const input={action:"OFFER_NEXT",confirmed:true,expectedPreviewToken,reason:"Next valid waitlisted learner"};
  expect(tpoWaitlistPromotionSchema.safeParse(input).success).toBe(true);
  expect(tpoWaitlistPromotionSchema.safeParse({...input,expectedPreviewToken:"X".repeat(64)}).success).toBe(false);
  expect(tpoWaitlistPromotionSchema.safeParse({...input,confirmed:false}).success).toBe(false);
 });
});
