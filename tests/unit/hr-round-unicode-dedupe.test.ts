import {expect,it} from "vitest";
import {duplicateRecruiterRoundName} from "@/modules/placements/hr-round-editor-model";
const rounds=[{id:"1",status:"PENDING",name:"Technical Interview"}];
it("rejects visual duplicates across width, case and spacing",()=>{
 expect(duplicateRecruiterRoundName(rounds,"ＴＥＣＨＮＩＣＡＬ  Interview")).toBe(true);
 expect(duplicateRecruiterRoundName(rounds," technical   interview ")).toBe(true);
});
it("does not block exclusion of the same round or a genuinely different title",()=>{
 expect(duplicateRecruiterRoundName(rounds,"Technical Interview","1")).toBe(false);
 expect(duplicateRecruiterRoundName(rounds,"Managerial Interview")).toBe(false);
});
