import {expect,it} from "vitest";
import {globalTpoRequestsQuerySchema,requestKindMatches} from "@/modules/placements/tpo-global-requests-model";
it("uses a fixed kind allowlist and never converts unknown kinds to ALL",()=>{
 expect(globalTpoRequestsQuerySchema.parse({}).requestType).toBe("ALL");
 expect(globalTpoRequestsQuerySchema.safeParse({requestType:"PRIVATE"}).success).toBe(false);
 expect(globalTpoRequestsQuerySchema.parse({requestType:"ROUND_RESCHEDULE"}).requestType).toBe("ROUND_RESCHEDULE");
 expect(requestKindMatches("ROUND_RESCHEDULE","ROUND_RESCHEDULE")).toBe(true);
 expect(requestKindMatches("OFFER_EXTENSION","ROUND_RESCHEDULE")).toBe(false);
});

import {sortTpoRequestRows,tpoNextRoundCue,tpoRequestUrgent} from "@/modules/placements/tpo-global-requests-model";
it("TPO-requests-verification-08 puts urgent pending decisions first, then soonest round and oldest request",()=>{
 const now=new Date("2026-10-16T05:00:00Z");
 const rows=[
  {id:"new",status:"PENDING",requestType:"OFFER_EXTENSION",requestedAt:new Date("2026-10-16T04:59:00Z"),nextRoundAt:null},
  {id:"old",status:"PENDING",requestType:"APPLICATION_WITHDRAWAL",requestedAt:new Date("2026-10-14T04:00:00Z"),nextRoundAt:null},
  {id:"round",status:"PENDING",requestType:"ROUND_RESCHEDULE",requestedAt:new Date("2026-10-16T01:00:00Z"),nextRoundAt:new Date("2026-10-16T06:00:00Z")},
  {id:"done",status:"APPROVED",requestType:"APPLICATION_WITHDRAWAL",requestedAt:new Date("2026-10-11T00:00:00Z"),nextRoundAt:null},
 ];
 expect(sortTpoRequestRows(rows,"URGENCY_FIRST",now).map(r=>r.id)).toEqual(["round","old","new","done"]);
 expect(tpoRequestUrgent(rows[1]!,now)).toBe(true);
 expect(tpoRequestUrgent(rows[3]!,now)).toBe(false);
 expect(tpoNextRoundCue({...rows[2]!,nextRoundName:"Interview"},now)).toContain("Interview today");
 expect(globalTpoRequestsQuerySchema.parse({}).sort).toBe("URGENCY_FIRST");
});
