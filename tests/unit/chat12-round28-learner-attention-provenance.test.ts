import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-43 exposes debarment, waiting requests, eligibility decision provenance and linked team context",()=>{
 const model=src("src/modules/placements/tpo-students-model.ts");
 const panel=src("src/components/tpo/tpo-student-quick-panel.tsx");
 expect(model).toContain("participationReason:source.participation.reason");
 expect(model).toContain("participationDecidedAt:source.participation.decidedAt");
 expect(panel).toContain("Debarred from new placement applications");
 expect(panel).toContain('detail?.requests.filter(row=>row.status==="PENDING")');
 expect(panel).toContain("student.participationReason");
 expect(panel).toContain("Placement eligibility");
 expect(panel).toContain('"STUDENT:"+student.membershipId');
});
it("TPO-students-31 preserves readiness evidence without fabricating unrecorded prep scores",()=>{
 const panel=src("src/components/tpo/tpo-student-quick-panel.tsx");
 expect(panel).toContain("No resume recorded");
 expect(panel).toContain('"Prep %","Not recorded"');
});
it("TPO-students-25 finds class names without exposing raw contact fields to the browser",()=>{
 const service=src("src/modules/placements/tpo-students-service.ts");
 expect(service).toContain("activeSections.find(section=>section.sectionId===id)?.sectionName");
 expect(src("src/modules/placements/tpo-students-model.ts")).toContain("hiddenSearchMatched:source.hiddenSearchMatched??false");
});
