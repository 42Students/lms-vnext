import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {trackerReportSchema} from "@/modules/bug-tracker/report-input-model";

const source=(p:string)=>readFileSync(p,"utf8");
describe("chat-16 tracker privacy-first evidence design",()=>{
 it("SA-placements-projects-103 rejects unsafe embedded evidence schemes while preserving a link-based report",()=>{
   const ui=source("src/components/tracker/tracker-report-form.tsx");
   const validation=source("src/modules/bug-tracker/report-input-model.ts");
   expect(ui).toContain('name="evidenceLink"');
   expect(ui).toContain("Direct clipboard paste and unscanned attachments are not accepted.");
   expect(ui).toContain("Do not share private screenshots through public URLs.");
   expect(validation).toContain('protocol: /^https?$/');
   const input={reporterName:"Akhila",accountRole:"SUPER_ADMIN",environment:"DEVELOPMENT",
     page:"Dashboard",screen:"Overview",section:null,issueType:"UI / Alignment",
     severity:"MINOR",description:"Layout is misaligned",evidenceLink:"javascript:alert(1)"};
   expect(trackerReportSchema.safeParse(input).success).toBe(false);
   expect(trackerReportSchema.safeParse({...input,evidenceLink:"https://example.org/evidence"}).success).toBe(true);
 });
 it("SA-placements-projects-103 never displays arbitrary API exception messages in the report form",()=>{
   const ui=source("src/components/tracker/tracker-report-form.tsx");
   expect(ui).toContain("caught instanceof FriendlyFetchError ? caught.message : friendlyApiError({})");
   expect(ui).not.toContain("caught instanceof Error ? caught.message");
 });
});
