import {it,expect} from "vitest";
import {filterTpoDriveDayIssues,tpoDriveDayIssueSchema} from "@/modules/placements/tpo-drive-day-issue-filter-model";
const rows=[{counts:{noShow:0,pending:3,unknown:0}},{counts:{noShow:0,pending:0,unknown:4}},{counts:{noShow:2,pending:0,unknown:0}}];
it("keeps pending status distinct from unrecorded/unknown attendance",()=>{
 expect(filterTpoDriveDayIssues(rows,"PENDING")).toEqual([rows[0]]);
 expect(filterTpoDriveDayIssues(rows,"NO_SHOWS")).toEqual([rows[2]]);
 expect(tpoDriveDayIssueSchema.safeParse("PENDING").success).toBe(true);
});
