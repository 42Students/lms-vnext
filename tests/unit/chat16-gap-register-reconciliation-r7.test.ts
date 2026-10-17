import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const queue=readFileSync("docs/orchestrator/queues/gap-closure-chat-16.md","utf8");
const register=readFileSync("docs/audit/gap-register.md","utf8");
const rows=queue.split("\n").flatMap(line=>{
 const match=line.match(/^- ((?:MEN-projects-meetings|SA-placements-projects)-\d+) \(S[1-4]\) — (DONE|NOT-A-GAP|BLOCKED)$/);
 return match?[{id:match[1]!,status:match[2]!}]:[];
});

describe("chat-16 centralized gap tracking reconciliation",()=>{
 it("chat-16 register includes exactly the 32 reassigned mentor and tracker gaps",()=>{
  expect(rows).toHaveLength(32);
  expect(new Set(rows.map(row=>row.id)).size).toBe(32);
 });
 it.each(rows)("$id retains the queue disposition and sole chat-16 ownership",({id,status})=>{
  const match=register.split("\n").find(line=>line.startsWith("| "+id+" |"));
  expect(match, id+" missing from central gap register").toBeDefined();
  const columns=match!.split("|").map(value=>value.trim());
  expect(columns[7]).toBe("chat-16");
  if(status==="DONE")expect(columns[6]).toBe("FIXED-ON-MAIN");
  if(status==="NOT-A-GAP")expect(columns[6]).toBe("VERIFIED");
  if(status==="BLOCKED"){
   expect(id).toBe("SA-placements-projects-120");
   expect(columns[6]).toBe("OPEN");
   expect(match).toContain("source unavailable");
  }
 });
});
