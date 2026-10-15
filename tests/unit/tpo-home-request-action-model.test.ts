import {it,expect} from "vitest";
import {pendingTpoRequestsAction} from "@/modules/placements/tpo-home-request-action-model";
it("adds an actionable request entry only for real, positive counts",()=>{
 expect(pendingTpoRequestsAction(0)).toBeNull();
 expect(pendingTpoRequestsAction(-2)).toBeNull();
 expect(pendingTpoRequestsAction(NaN)).toBeNull();
 expect(pendingTpoRequestsAction(1)).toEqual({href:"/tpo/requests",label:"1 pending placement request"});
 expect(pendingTpoRequestsAction(3)?.label).toBe("3 pending placement requests");
});
