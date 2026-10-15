import {it,expect} from "vitest";
import {tpoBatchPageSchema,paginateTpoBatches,tpoBatchPageHref} from "@/modules/placements/tpo-batch-directory-pagination-model";
it("paginates the already-scoped and filtered snapshot without mutating it",()=>{
 const rows=Array.from({length:26},(_,i)=>i+1);
 const result=paginateTpoBatches(rows,2,24);
 expect(result.items).toEqual([25,26]);expect(result.from).toBe(25);expect(result.to).toBe(26);expect(result.hasNext).toBe(false);
 expect(paginateTpoBatches(rows,1,24).hasNext).toBe(true);
 expect(rows.length).toBe(26);
});
it("validates page and keeps filters on explicit navigation",()=>{
 expect(tpoBatchPageSchema.parse({})).toEqual({page:1,pageSize:24});
 expect(tpoBatchPageSchema.safeParse({page:"-1"}).success).toBe(false);
 expect(tpoBatchPageSchema.safeParse({pageSize:999}).success).toBe(false);
 expect(tpoBatchPageHref({q:"B Tech",state:"INVITED"},2,24)).toContain("q=B+Tech&state=INVITED&page=2&pageSize=24");
});
