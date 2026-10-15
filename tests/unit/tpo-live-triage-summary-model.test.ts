import {it,expect} from "vitest";
import {summarizeTpoLiveTriage} from "@/modules/placements/tpo-live-triage-summary-model";
it("aggregates observed evidence, not assumed outcomes",()=>{
 expect(summarizeTpoLiveTriage([{counts:{total:6,checkedIn:2,noShow:1,pending:2,unknown:1}},{counts:{total:2,checkedIn:0,noShow:0,pending:0,unknown:2}}])).toEqual({rounds:2,roster:8,checkedIn:2,explicitNoShows:1,pending:2,unrecorded:3});
 expect(summarizeTpoLiveTriage([]).roster).toBe(0);
});
