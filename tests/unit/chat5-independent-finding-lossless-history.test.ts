import {describe,expect,it} from "vitest";
import {independentFindingHistoryChanges} from "@/modules/bug-tracker/independent-finding-audit-history-model";
describe("G2-2-001-038 independent finding audit diff",()=>{
 it("renders explicit old/new assignee and severity values",()=>{
  const rows=independentFindingHistoryChanges(
   {status:"NEW",severity:"LOW",assignee:null},
   {status:"IN_PROGRESS",severity:"HIGH",assignee:"reviewer"});
  expect(rows).toEqual([
   {label:"Status",before:"NEW",after:"IN_PROGRESS"},
   {label:"Severity",before:"LOW",after:"HIGH"},
   {label:"Assignee",before:"None",after:"reviewer"},
  ]);
 });
 it("preserves repo and hash in commit history without dumping arbitrary JSON",()=>{
  const rows=independentFindingHistoryChanges({fixCommits:[]},{
   fixCommits:[{repo:"lms-vnext",sha:"abcdef0123"}],token:"must-not-show"});
  expect(rows).toEqual([{label:"Fix commits",before:"None",after:"lms-vnext@abcdef0123"}]);
  expect(JSON.stringify(rows)).not.toContain("must-not-show");
 });
 it("keeps pre-migration events with empty snapshots renderable",()=>{
  expect(independentFindingHistoryChanges(null,null)).toEqual([]);
  expect(independentFindingHistoryChanges({status:"NEW"},{status:"NEW"})).toEqual([]);
 });
});
