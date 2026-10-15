import {it,expect} from "vitest";
import {tpoPreparationFocusRows,tpoPreparationNudgeMessage} from "@/modules/placements/tpo-student-preparation-nudge-model";
const rows=[
 {registeredForPlacements:false,readinessSignal:"ACADEMIC_EVIDENCE_MISSING" as const},
 {registeredForPlacements:true,readinessSignal:"ACADEMIC_EVIDENCE_MISSING" as const},
 {registeredForPlacements:true,readinessSignal:"PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT" as const}
];
it("only suggests manual support for in-pool evidence gaps without assigning courses",()=>{
 expect(tpoPreparationFocusRows(rows)).toEqual([rows[1]]);
 expect(tpoPreparationNudgeMessage(rows[1])).toContain("not an eligibility judgment");
 expect(tpoPreparationNudgeMessage(rows[0])).toContain("No registration is assumed");
});
