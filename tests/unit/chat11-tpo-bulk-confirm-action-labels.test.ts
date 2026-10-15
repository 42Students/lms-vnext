import {expect,it} from "vitest";
import {tpoBulkActionLabel} from "@/modules/placements/tpo-bulk-workflow-model";
it("uses unambiguous language for every authorized bulk confirmation",()=>{
 expect(tpoBulkActionLabel("ELIGIBLE")).toBe("Mark learners eligible");
 expect(tpoBulkActionLabel("CLEAR_OVERRIDE")).toBe("Clear learner overrides");
 expect(tpoBulkActionLabel("SHORTLISTED")).toBe("Shortlist applicants");
 expect(tpoBulkActionLabel("REJECTED")).toBe("Reject applicants");
});
