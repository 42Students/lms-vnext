import {it,expect} from "vitest";
import {serializeTpoCohortHistoryCsv,tpoCohortHistoryCsvHref} from "@/modules/placements/tpo-batch-history-csv-model";
it("exports only supplied events, not private reasons or learner contact details",()=>{
 const csv=serializeTpoCohortHistoryCsv([{id:"x",kind:"DECIDE",before:null,after:"INELIGIBLE",actionId:"=HYPERLINK()",reversesActionId:null,occurredAt:new Date("2026-10-15T10:00:00Z")}]);
 expect(csv).toContain('"\'=HYPERLINK()"');
 expect(csv).toContain("NOT_DECIDED");
 expect(csv).not.toContain("Reason");
 expect(csv).not.toContain("Email");
});
it("preserves validated event-kind and after-state URL context",()=>{
 const href=tpoCohortHistoryCsvHref("cohort", {kind:"UNDO",after:"ELIGIBLE"});
 expect(href).toContain("kind=UNDO&after=ELIGIBLE");
 expect(href).not.toContain("collegeId");
});
