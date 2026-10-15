import {describe,it,expect} from "vitest";
import {tpoRoundResultViewSchema,filterTpoRoundResultRows} from "../../src/modules/placements/tpo-round-result-table-model";
const rows=[{student:"Asha",role:"Developer",resultStatus:null},{student:"Bela",role:"Tester",resultStatus:"STAGED"},{student:"Charan",role:"Developer",resultStatus:"APPLIED"}];
describe("round result management filters",()=>{
 it("keeps unrecorded distinct from staged or applied",()=>{
  const q=tpoRoundResultViewSchema.parse({status:"NOT_RECORDED"});
  expect(filterTpoRoundResultRows(rows,q).map(r=>r.student)).toEqual(["Asha"]);
 });
 it("searches role and name case-insensitively",()=>{
  expect(filterTpoRoundResultRows(rows,tpoRoundResultViewSchema.parse({q:"developer"}))).toHaveLength(2);
 });
 it("rejects invalid state and oversized queries",()=>{
  expect(tpoRoundResultViewSchema.safeParse({status:"REJECTED"}).success).toBe(false);
  expect(tpoRoundResultViewSchema.safeParse({q:"z".repeat(101)}).success).toBe(false);
 });
});
