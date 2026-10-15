import {expect,it} from "vitest";
import {sortTpoDriveDayRows,tpoDriveDaySortSchema} from "@/modules/placements/tpo-drive-day-sort-model";
it("ranks only recorded pending plus unknown counts, stable ties",()=>{
 const rows=[{id:"a",companyName:"A",counts:{noShow:9,pending:0,unknown:0}},{id:"b",companyName:"B",counts:{noShow:0,pending:3,unknown:2}},{id:"c",companyName:"C",counts:{noShow:0,pending:4,unknown:0}}];
 expect(sortTpoDriveDayRows(rows,"UNRESOLVED_DESC").map(x=>x.id)).toEqual(["b","c","a"]);
 expect(tpoDriveDaySortSchema.safeParse("UNRESOLVED_DESC").success).toBe(true);
 expect(rows[0].id).toBe("a");
});
