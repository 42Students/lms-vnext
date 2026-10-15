import {expect,it} from "vitest";
import {sortTpoRequestRows,globalTpoRequestsQuerySchema} from "@/modules/placements/tpo-global-requests-model";
it("sorts the entire scoped result before paging, stably by request id",()=>{
 const rows=[{id:"b",requestedAt:new Date("2026-10-15T10:00:00Z")},{id:"a",requestedAt:new Date("2026-10-15T10:00:00Z")},{id:"c",requestedAt:new Date("2026-10-14T10:00:00Z")}];
 expect(sortTpoRequestRows(rows,"OLDEST_FIRST").map(r=>r.id)).toEqual(["c","a","b"]);
 expect(sortTpoRequestRows(rows,"NEWEST_FIRST").map(r=>r.id)).toEqual(["b","a","c"]);
 expect(rows[0].id).toBe("b");
});
it("rejects undefined sorting modes",()=>expect(globalTpoRequestsQuerySchema.safeParse({sort:"UNSAFE"}).success).toBe(false));
