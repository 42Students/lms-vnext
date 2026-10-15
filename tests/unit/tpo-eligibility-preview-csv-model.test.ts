import {expect,it} from "vitest";
import {serializeTpoEligibilityPreviewCsv} from "@/modules/placements/tpo-eligibility-preview-csv-model";
it("escapes formula-like skip reasons and excludes version tokens",()=>{
 const csv=serializeTpoEligibilityPreviewCsv([{studentCode:"uuid",decision:"INELIGIBLE",reason:"reason"}],
 [{index:0,status:"unusable",reason:"=BAD()",membershipId:null,expectedVersion:"secret"}]);
 expect(csv).toContain('"\'=BAD()"');
 expect(csv).not.toContain("secret");
 expect(csv).toContain('"unusable"');
});
it("refuses stale preview/result shape mismatch",()=>expect(()=>serializeTpoEligibilityPreviewCsv([{studentCode:"one",decision:"ELIGIBLE",reason:""}],[])).toThrow());
