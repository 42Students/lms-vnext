import {it,expect} from "vitest";
import {isCurrentBulkPlan} from "@/modules/placements/tpo-bulk-plan-model";
it("rejects any changed version, revision, order or scope",()=>{
 const a={action:"ELIGIBILITY",scopeId:"f1d5c117-1a6e-4d45-b83d-001fc5077011",revision:"1",rows:[{id:"a1d5c117-1a6e-4d45-b83d-001fc5077011",version:"1"}]};
 expect(isCurrentBulkPlan(a,a)).toBe(true);
 expect(isCurrentBulkPlan(a,{...a,revision:"2"})).toBe(false);
 expect(isCurrentBulkPlan(a,{...a,rows:[{...a.rows[0],version:"2"}]})).toBe(false);
});
