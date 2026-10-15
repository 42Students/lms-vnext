import {it,expect} from "vitest";
import {filterTpoLiveRoundSearch,tpoLiveRoundSearchSchema} from "@/modules/placements/tpo-live-round-search-model";
it("matches company, job, and round names on authorized rows without mutation",()=>{
 const rows=[{companyName:"Acme",jobTitle:"SDE",name:"Interview"},{companyName:"Delta",jobTitle:"Data Analyst",name:"Aptitude"}];
 expect(filterTpoLiveRoundSearch(rows,"  acme  ")).toEqual([rows[0]]);
 expect(filterTpoLiveRoundSearch(rows,"data")).toEqual([rows[1]]);
 expect(filterTpoLiveRoundSearch(rows,"interview")).toEqual([rows[0]]);
 expect(rows).toHaveLength(2);
});
it("rejects oversized URL terms",()=>{expect(tpoLiveRoundSearchSchema.parse(undefined)).toBe("");expect(tpoLiveRoundSearchSchema.safeParse("x".repeat(101)).success).toBe(false);});
