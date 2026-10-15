import {it,expect} from "vitest";
import {getTpoInvitationReadiness} from "@/modules/placements/tpo-batch-invitation-readiness-model";
it("uses exclusive deadline, and never infers a delivered message",()=>{
 const now=new Date("2026-10-15T10:00:00Z");
 expect(getTpoInvitationReadiness(null,now).stage).toBe("NOT_CONFIGURED");
 expect(getTpoInvitationReadiness({invitedAt:null,finishedAt:null,deadline:null},now).stage).toBe("NOT_MARKED");
 const data={invitedAt:new Date("2026-10-14T10:00:00Z"),finishedAt:null,deadline:now};
 expect(getTpoInvitationReadiness(data,now).stage).toBe("DEADLINE_PASSED");
 expect(getTpoInvitationReadiness({...data,deadline:new Date("2026-10-16T10:00:00Z")},now).stage).toBe("OPEN");
});
