import {expect,it} from "vitest";
import {learnerApplicationSelectionMissing} from "@/modules/placements/learner-application-selection-model";
it("reports inaccessible application selectors without examining foreign records",()=>{
 const own=[{applicationId:"a"},{applicationId:"b"}];
 expect(learnerApplicationSelectionMissing(own,"a")).toBe(false);
 expect(learnerApplicationSelectionMissing(own,"foreign")).toBe(true);
 expect(learnerApplicationSelectionMissing(own,undefined)).toBe(false);
 expect(learnerApplicationSelectionMissing([], "unknown")).toBe(true);
});
