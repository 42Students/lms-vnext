import {it,expect} from "vitest";
import {parseTpoEligibilityCsv,previewEligibilityImport} from "@/modules/placements/tpo-eligibility-import-model";
const a="a1d5c117-1a6e-4d45-b83d-001fc5077011";
const b="b2d5c117-1a6e-4d45-b83d-001fc5077011";
it("validates CSV format, denies unrecognized/duplicate learners and missing reasons",()=>{
 const rows=parseTpoEligibilityCsv("studentCode,decision,reason\n"+a+",ELIGIBLE,\n"+a+",ELIGIBLE,\n"+b+",INELIGIBLE,");
 expect(previewEligibilityImport(rows,[{studentCode:a,membershipId:a,expectedVersion:"none"}]).map(r=>r.status)).toEqual(["matched","unusable","unusable"]);
 expect(()=>parseTpoEligibilityCsv('"'+a+'",ELIGIBLE,')).toThrow();
 expect(()=>parseTpoEligibilityCsv("wrong,ELIGIBLE,")).toThrow();
});
