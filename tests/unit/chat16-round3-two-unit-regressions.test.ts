import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {relativeHrBellTime} from "@/modules/placements/hr-recruiter-bell-model";

const read=(path:string)=>readFileSync(path,"utf8");

describe("REC-calendar-messages-profile-21 Round 3 notification polling",()=>{
 it("REC-calendar-messages-profile-21 refreshes relative time after failed as well as successful network polls",()=>{
  const bell=read("src/components/hr/hr-recruiter-bell.tsx");
  const scopedLoad=bell.slice(bell.indexOf("const load=useCallback("),bell.indexOf(" async function markAll()"));
  expect(scopedLoad).toContain('if(!loadGate.current.isCurrent(request))return;');
  expect(scopedLoad).toContain(': "Couldn\'t refresh your notifications"');
  expect(scopedLoad).toContain("finally{if(loadGate.current.isCurrent(request))setNow(Date.now());}");
  expect(bell).toContain("window.setInterval(tick,30000)");
  expect(bell).toContain('document.visibilityState==="visible"');
  expect(relativeHrBellTime("2026-10-18T00:00:00.000Z",Date.parse("2026-10-18T00:30:00.000Z"))).toBe("30m ago");
 });
 it("REC-calendar-messages-profile-21 retains caller-scoped notification marking under the current college grant",()=>{
  const service=read("src/modules/placements/hr-recruiter-bell-service.ts");
  expect(service).toContain("listOwnRecruiterPlacementJobs(ctx,feed.collegeId)");
  expect(service).toContain("eq(inAppNotifications.userId,ctx.user.id)");
  expect(service).toContain("x.companyId===ctx.recruiter!.companyId && x.collegeId===feed.collegeId");
  expect(service).toContain("eq(activityEvents.collegeId,feed.collegeId)");
  expect(service).toContain("inArray(activityEvents.subjectId,jobIds)");
 });
});

describe("chat-16 Round 3 canonical gap queue reconciliation",()=>{
 it("the 32 originally reassigned IDs remain one-to-one with the central register after review",()=>{
  const queue=read("docs/orchestrator/queues/gap-closure-chat-16.md");
  const register=read("docs/audit/gap-register.md");
  // The first queue section is the original 32-gap rebalance. Appended
  // work rounds may contain more gap IDs without invalidating its inventory.
  const initialQueue=queue.split("## Chat-16 reassigned round checkpoints",1)[0]!;
  const ids=initialQueue.split("\n").flatMap(line=>{
   const hit=line.match(/^- ((?:MEN-projects-meetings|SA-placements-projects)-\d+) \(S[1-4]\) — (DONE|NOT-A-GAP|BLOCKED)$/);
   return hit?[hit[1]!]:[];
  });
  expect(ids).toHaveLength(32);
  expect(new Set(ids).size).toBe(32);
  for(const id of ids){
   const records=register.split("\n").filter(row=>row.startsWith("| "+id+" |"));
   expect(records,id+" must not be missing or duplicated").toHaveLength(1);
   expect(records[0]!.split("|")[9]?.trim(),id+" needs a review or implementation citation").toBeTruthy();
  }
 });
});