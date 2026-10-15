import {it,expect} from "vitest";
import {tpoDriveDayIssueSchema,filterTpoDriveDayIssues} from "@/modules/placements/tpo-drive-day-issue-filter-model";
const rows=[{counts:{noShow:1,pending:0,unknown:0}},{counts:{noShow:0,pending:0,unknown:3}}];
it("shows only explicit absent evidence instead of treating unknown as no-show",()=>{
 expect(filterTpoDriveDayIssues(rows,"NO_SHOWS")).toEqual([rows[0]]);
 expect(filterTpoDriveDayIssues(rows,"ALL")).toHaveLength(2);
 expect(rows).toHaveLength(2);
});
it("rejects malformed issue filters",()=>{expect(tpoDriveDayIssueSchema.parse(undefined)).toBe("ALL");expect(tpoDriveDayIssueSchema.safeParse("ABSENT_OR_UNKNOWN").success).toBe(false);});
