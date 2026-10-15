import {it,expect} from "vitest";
import {sortTpoDriveDayRows,tpoDriveDaySortSchema} from "@/modules/placements/tpo-drive-day-sort-model";
const rows=[{id:"b",companyName:"A",counts:{pending:1,noShow:0}},{id:"c",companyName:"B",counts:{pending:0,noShow:4}},{id:"a",companyName:"C",counts:{pending:3,noShow:1}}];
it("sorts the already-scoped live slice and retains arrival order when recent",()=>{
 expect(sortTpoDriveDayRows(rows,"PENDING_DESC").map(x=>x.id)).toEqual(["a","b","c"]);
 expect(sortTpoDriveDayRows(rows,"NO_SHOW_DESC").map(x=>x.id)).toEqual(["c","a","b"]);
 expect(sortTpoDriveDayRows(rows,"RECENT")).toEqual(rows);
 expect(rows[0].id).toBe("b");
});
it("disallows query-controlled arbitrary field sorting",()=>{expect(tpoDriveDaySortSchema.parse(undefined)).toBe("RECENT");expect(tpoDriveDaySortSchema.safeParse("companyId").success).toBe(false);});
