import {it,expect} from "vitest";
import {filterTpoDriveDayIssues,tpoDriveDayIssueSchema} from "@/modules/placements/tpo-drive-day-issue-filter-model";
it("requires an actual nonempty roster before treating all statuses as unknown",()=>{
 const rows=[{counts:{total:5,unknown:5,pending:0,noShow:0}},{counts:{total:0,unknown:0,pending:0,noShow:0}},{counts:{total:3,unknown:2,pending:1,noShow:0}}];
 expect(filterTpoDriveDayIssues(rows,"ALL_UNRECORDED")).toEqual([rows[0]]);
 expect(tpoDriveDayIssueSchema.safeParse("ALL_UNRECORDED").success).toBe(true);
});
