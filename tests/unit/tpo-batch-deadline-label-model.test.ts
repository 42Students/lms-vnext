import {it,expect} from "vitest";
import {tpoBatchDeadlineLabel} from "@/modules/placements/tpo-batch-deadline-label-model";
it("clearly distinguishes unknown, absent and saved deadlines",()=>{
 expect(tpoBatchDeadlineLabel(null,false)).toBe("Deadline unavailable");
 expect(tpoBatchDeadlineLabel(null,true)).toBe("No registration deadline recorded");
 expect(tpoBatchDeadlineLabel(new Date("2026-10-15T08:30:00Z"),true)).toContain("15 Oct 2026");
 expect(tpoBatchDeadlineLabel(new Date("2026-10-15T08:30:00Z"),true)).toContain("IST");
});
