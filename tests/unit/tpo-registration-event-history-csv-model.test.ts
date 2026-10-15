import {expect,it} from "vitest";
import {serializeTpoRegistrationEventHistoryCsv} from "@/modules/placements/tpo-registration-event-history-csv-model";
import {tpoRegistrationHistoryFilterHref} from "@/modules/placements/tpo-registration-history-filter-model";
it("exports only immutable choice/source/timestamp, no consent tokens or personal contacts",()=>{
 const csv=serializeTpoRegistrationEventHistoryCsv([{previousChoice:null,nextChoice:"=HYPERLINK()",source:"SELF",occurredAt:new Date("2026-10-15T10:00:00Z")}]);
 expect(csv).toContain('"\'=HYPERLINK()"');
 expect(csv).toContain("NOT_RECORDED");
 expect(csv).not.toContain("Consent");
 expect(csv).not.toContain("Email");
});
it("maintains exact reviewed filters without query-provided college IDs",()=>{
 const href=tpoRegistrationHistoryFilterHref("b","m",{source:"SELF",event:"CHANGE"},true);
 expect(href).toContain("/api/placements/tpo/batches/b/registrations/m/history/export?");
 expect(href).toContain("source=SELF&event=CHANGE");
});
