import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoRulesChangeSchema} from "@/modules/placements/tpo-season-write-model";
const valid={confirmed:true,expectedVersion:0,countsAsPlacedAt:"OFFER_ACCEPTED",maxHeldOffers:2,upliftPct:20,minResponseHours:24};
describe("TPO final sprint placed-offer policy",()=>{
 it("TPO-settings-audit-11 permits only released or accepted offers at the validated server boundary",()=>{
  expect(tpoRulesChangeSchema.safeParse(valid).success).toBe(true);
  expect(tpoRulesChangeSchema.safeParse({...valid,countsAsPlacedAt:"OFFER_RELEASED"}).success).toBe(true);
  for(const unsupported of ["SELECTED","SHORTLISTED","ISSUED",""])expect(tpoRulesChangeSchema.safeParse({...valid,countsAsPlacedAt:unsupported}).success).toBe(false);
  const ui=readFileSync("src/components/placements/tpo-college-rules-control.tsx","utf8");
  expect(ui).toContain('<option value="OFFER_RELEASED">released</option>');
  expect(ui).toContain('<option value="OFFER_ACCEPTED">accepted</option>');
  expect(ui).not.toContain('<option value="SELECTED">');
 });
});