import {it,expect} from "vitest";
import {sortTpoBatchNames,tpoBatchSortSchema} from "@/modules/placements/tpo-batch-sort-model";
const rows=[{id:"none",name:"A",deadline:null},{id:"older",name:"B",deadline:new Date("2026-10-16Z")},{id:"newer",name:"C",deadline:new Date("2026-10-20Z")}];
it("sorts real deadlines, always putting unknowns last",()=>{
 expect(sortTpoBatchNames(rows,"DEADLINE_ASC").map(x=>x.id)).toEqual(["older","newer","none"]);
 expect(sortTpoBatchNames(rows,"DEADLINE_DESC").map(x=>x.id)).toEqual(["newer","older","none"]);
 expect(rows[0].id).toBe("none");
});
it("recognizes only explicit supported sort keys",()=>{expect(tpoBatchSortSchema.safeParse("DEADLINE_ASC").success).toBe(true);expect(tpoBatchSortSchema.safeParse("WRONG").success).toBe(false);});
