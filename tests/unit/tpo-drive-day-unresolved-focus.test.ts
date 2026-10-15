import {it,expect} from "vitest";
import {filterTpoDriveDayIssues,tpoDriveDayIssueSchema} from "@/modules/placements/tpo-drive-day-issue-filter-model";
it("includes pending and unknown, but not explicit absent-only rounds",()=>{
 const rows=[{counts:{noShow:0,pending:2,unknown:0}},{counts:{noShow:0,pending:0,unknown:2}},{counts:{noShow:1,pending:0,unknown:0}}];
 expect(filterTpoDriveDayIssues(rows,"UNRESOLVED")).toEqual([rows[0],rows[1]]);
 expect(tpoDriveDayIssueSchema.safeParse("UNRESOLVED").success).toBe(true);
});
