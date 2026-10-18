import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const queue=readFileSync("docs/orchestrator/queues/gap-closure-chat-16.md","utf8");
const register=readFileSync("docs/audit/gap-register.md","utf8");
// Only the original rebalance is fixed at 32 entries. Later work-package
// sections may append new assignments and must not retroactively rewrite this
// historical acceptance inventory.
const initialQueue=queue.split("## Chat-16 reassigned round checkpoints",1)[0]!;
const rows=initialQueue.split("\n").flatMap(line=>{
 const match=line.match(/^- ((?:MEN-projects-meetings|SA-placements-projects)-\d+) \(S[1-4]\) — (DONE|NOT-A-GAP|BLOCKED)$/);
 return match?[{id:match[1]!,status:match[2]!}]:[];
});

describe("chat-16 centralized gap tracking reconciliation",()=>{
 it("chat-16 register includes exactly the 32 reassigned mentor and tracker gaps",()=>{
  expect(initialQueue).toContain("- MEN-projects-meetings-53 (S3) — DONE");
  expect(initialQueue).toContain("- SA-placements-projects-122 (S3) — DONE");
  expect(rows).toHaveLength(32);
  expect(new Set(rows.map(row=>row.id)).size).toBe(32);
 });
 it("chat-16 historical gap inventory is unchanged by later queue sections",()=>{
  const future=queue+"\n## Future reassignments\n- MEN-projects-meetings-999 (S4) — DONE\n";
  expect(future.split("## Chat-16 reassigned round checkpoints",1)[0]).toBe(initialQueue);
 });
 it.each(rows)("$id remains in the canonical register after cross-lane verification",({id,status})=>{
  const match=register.split("\n").find(line=>line.startsWith("| "+id+" |"));
  expect(match, id+" missing from central gap register").toBeDefined();
  const columns=match!.split("|").map(value=>value.trim());
  // The canonical tracker was independently re-audited by chat-7 (mentor)
  // and chat-9 (tracker). Historical queue ownership is not the source of
  // truth and must not be restored over newer review decisions.
  const verifiedBy=id.startsWith("MEN-")?"chat-7":"chat-9";
  expect([verifiedBy,"chat-16"]).toContain(columns[7]);
  expect(columns[9],id+" is missing its acceptance or commit citation").toBeTruthy();
  if(status==="DONE")expect(["FIXED-ON-MAIN","VERIFIED"]).toContain(columns[6]);
  if(status==="NOT-A-GAP")expect(columns[6]).toBe("VERIFIED");
  if(status==="BLOCKED"){
   expect(id).toBe("SA-placements-projects-120");
   // Reviewer VERIFIED means tracker reconciliation, not a real GitHub
   // findings import: provider connectivity remains independently gated.
   expect(["OPEN","VERIFIED"]).toContain(columns[6]);
  }
 });
});
