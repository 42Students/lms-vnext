import {describe,expect,it} from "vitest";
import {tpoGeneralRequestInputSchema,tpoGeneralRequestTarget} from "@/modules/placements/tpo-general-request-model";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("General learner requests against registered 0134",()=>{
 it("TPO-requests-verification-01 bounds external company names to the effective 150-character target column",()=>{
  const base={kind:"OFF_CAMPUS_OFFER",reason:"Please review",ctcLpa:"6.50",proofUrl:""};
  expect(tpoGeneralRequestInputSchema.safeParse({...base,companyName:"x".repeat(151)}).success).toBe(false);
  const value=tpoGeneralRequestInputSchema.parse({...base,companyName:"x".repeat(150)});
  expect(tpoGeneralRequestTarget(value)).toHaveLength(150);
 });
 it("TPO-requests-verification-01 bounds corrected record field keys and does not truncate identities",()=>{
  const base={kind:"CORRECTION_WITH_PROOF",reason:"Please review",section:"EDUCATION",proposedValue:"7.2",proofUrl:""};
  expect(tpoGeneralRequestInputSchema.safeParse({...base,field:"x".repeat(141)}).success).toBe(false);
  const valid=tpoGeneralRequestInputSchema.parse({...base,field:"x".repeat(140)});
  expect(tpoGeneralRequestTarget(valid)).toHaveLength(150);
  const schema=src("src/db/schema/placement-general-requests.ts");
  expect(schema).toContain('targetKey:varchar("target_key",{length:150})');
 });
 it("TPO-requests-verification-01 proposes additive correction without changing numbered 0134",()=>{
  const proposed=src("docs/proposed-migrations/chat-12-0134-general-requests-correction.sql");
  expect(proposed).toContain("PROPOSAL ONLY");
  expect(proposed).not.toContain("ALTER COLUMN target_key TYPE text");
  expect(proposed).toContain("retain this stronger canonical contract");
  expect(proposed).toContain("OFFER_ACCEPTANCE_DISPUTE");
 });
});
