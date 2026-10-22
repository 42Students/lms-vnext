import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {trackerReportSchema} from "@/modules/bug-tracker/report-input-model";

const source=(p:string)=>readFileSync(p,"utf8");
describe("chat-16 tracker privacy-first evidence design",()=>{
 it("SA-placements-projects-103 rejects unsafe embedded evidence schemes while preserving a link-based report",()=>{
   const ui=source("src/components/tracker/tracker-report-form.tsx");
   const validation=source("src/modules/bug-tracker/report-input-model.ts");
   expect(ui).toContain('name="evidenceLink"');
   expect(ui).toContain("Drag, paste or choose up to 3 screenshots");
   expect(ui).toContain('accept="image/png,image/jpeg,image/webp"');
   expect(ui).toContain("void uploadScreenshots(payload.issue.publicId)");
   expect(ui).toContain("For privacy, never publish private screenshots via an unrestricted URL.");
   expect(validation).toContain('protocol: /^https?$/');
   const input={reporterName:"Akhila",accountRole:"SUPER_ADMIN",environment:"DEVELOPMENT",
     page:"Dashboard",screen:"Overview",section:null,issueType:"UI / Alignment",
     severity:"MINOR",description:"Layout is misaligned",evidenceLink:"javascript:alert(1)"};
   expect(trackerReportSchema.safeParse(input).success).toBe(false);
   expect(trackerReportSchema.safeParse({...input,evidenceLink:"https://example.org/evidence"}).success).toBe(true);
 });
 it("SA-placements-projects-103 never displays arbitrary API exception messages in the report form",()=>{
   const ui=source("src/components/tracker/tracker-report-form.tsx");
   expect(ui).toContain('setError(caught instanceof FriendlyFetchError ? caught.message :');
   expect(ui).toContain("The issue could not be reported. Your text is still here");
   expect(ui).not.toContain("caught instanceof Error ? caught.message");
 });
});
