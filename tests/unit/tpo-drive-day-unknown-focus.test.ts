import {it,expect} from "vitest";
import {tpoDriveDayIssueSchema,filterTpoDriveDayIssues} from "@/modules/placements/tpo-drive-day-issue-filter-model";
it("only includes unknown-record attendance, without implying no-show",()=>{
 const rows=[{counts:{noShow:0,pending:0,unknown:2}},{counts:{noShow:4,pending:0,unknown:0}},{counts:{noShow:0,pending:3,unknown:0}}];
 expect(filterTpoDriveDayIssues(rows,"UNKNOWN")).toEqual([rows[0]]);
 expect(tpoDriveDayIssueSchema.safeParse("UNKNOWN").success).toBe(true);
 expect(rows).toHaveLength(3);
});
