import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoBatchRuleSaveSchema,tpoBatchRuleOverridesSchema} from "@/modules/placements/tpo-batch-rules-model";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO batch-specific placement rules",()=>{
 it("TPO-batches-53 persists strict batch overrides without altering registration lifecycle",()=>{
  expect(tpoBatchRuleSaveSchema.safeParse({rulesOverride:{maxHeldOffers:5,upliftPct:200,minResponseHours:12,countsAsPlacedAt:"OFFER_ACCEPTED"},expectedVersion:"none"}).success).toBe(true);
  for(const override of [{maxHeldOffers:6},{upliftPct:-1},{minResponseHours:11},{countsAsPlacedAt:"SELECTED"},{unknown:true}]){
   expect(tpoBatchRuleOverridesSchema.safeParse(override).success).toBe(false);
  }
  const page=source("src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx");
  const ui=source("src/components/tpo/tpo-batch-rule-editor.tsx");
  expect(page).toContain("getCollegePlacementRules");
  expect(page).toContain("lifecycle?.rulesOverride");
  for(const label of ["Counts as placed when","Offers a student can hold","Once placed, can apply again for at least","Time to respond to an offer","Use the college","Follow the college rules"])
   expect(ui).toContain(label);
  expect(ui).toContain("beforeunload");
  const service=source("src/modules/placements/tpo-batch-rules-service.ts");
  expect(service).toContain("upsertPlacementBatchSettings(ctx,");
  expect(service).toContain("registrationDeadline:lifecycle?.registrationDeadline??null");
  expect(service).toContain("expectedVersion:input.expectedVersion");
  const route=source("src/app/api/placements/tpo/batches/[batchId]/rules/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  const writer=source("src/modules/placements/batch-participation-service.ts");
  expect(writer).toContain("placements.batch.rules.changed");
 });
});
