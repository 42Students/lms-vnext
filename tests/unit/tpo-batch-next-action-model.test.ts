import {it,expect} from "vitest";
import {tpoBatchNextAction} from "@/modules/placements/tpo-batch-next-action-model";
it("labels only observed lifecycle facts; does not claim invitations were sent",()=>{
 expect(tpoBatchNextAction({invitedAt:null,finishedAt:null},false)).toBe("Review cohort");
 expect(tpoBatchNextAction({invitedAt:null,finishedAt:null},true)).toBe("Review and invite");
 expect(tpoBatchNextAction({invitedAt:new Date(),finishedAt:null},true)).toBe("Monitor batch");
 expect(tpoBatchNextAction({invitedAt:new Date(),finishedAt:new Date()},true)).toBe("Review history");
});
