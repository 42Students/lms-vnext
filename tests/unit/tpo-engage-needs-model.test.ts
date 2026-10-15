import {expect,it} from "vitest";
import {engageNeedsCounts,matchesEngageNeed} from "@/modules/placements/tpo-engage-needs-model";
it("counts only actionable unsuppressed recruiter follow-ups",()=>{
 const row={manualStage:"NEW",ownerMembershipId:null,inviteSentAt:null,unsubscribedAt:null};
 const blocked={...row,unsubscribedAt:"2026-10-01"};
 expect(engageNeedsCounts([row,blocked])).toEqual({all:2,unassigned:1,notContacted:1});
 expect(matchesEngageNeed({...row,manualStage:"NOT_NOW"},"UNASSIGNED")).toBe(false);
});
