import {describe,it,expect} from "vitest";
import {summarizeFailedRoundSharesByBranch} from "../../src/modules/placements/tpo-failure-round-share-model";
describe("TPO failure reasons by round and branch",()=>{
 it("TPO-calendar-reports-48 counts each applied result once with branch-specific denominator",()=>{
  const base={roundId:"round",roundName:"Technical",jobId:"job",branchId:"branch-1",branchName:"CSE"};
  const rows=[{...base,id:"decision-1",outcome:"FAIL"},{...base,id:"decision-2",outcome:"PASS"},
   {...base,id:"decision-1",outcome:"FAIL"},{...base,id:"decision-3",branchId:null,branchName:null,outcome:"FAIL"}];
  const grouped=summarizeFailedRoundSharesByBranch(rows);
  const cse=grouped.find(x=>x.branchId==="branch-1");
  expect(cse).toMatchObject({failed:1,decisions:2,shareOfRoundPercent:50});
  expect(grouped.find(x=>x.branchId===null)).toMatchObject({branchName:"Not recorded",failed:1,decisions:1});
 });
});