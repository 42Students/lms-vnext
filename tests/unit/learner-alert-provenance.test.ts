import {it,expect} from "vitest";
import {presentOwnLearnerPlacementAlerts} from "@/modules/placements/learner-placement-alerts-model";
it("keeps persisted personal notification unread/read semantics and safe action routes",()=>{
 const x=presentOwnLearnerPlacementAlerts([{id:"n1",title:"Notice",body:"Saved",actionHref:"/learn/my-placements",createdAt:new Date("2026-10-15T00:00:00Z"),readAt:null}]);
 expect(x).toHaveLength(1);expect(x[0].unread).toBe(true);
 expect(x[0].actionHref).toBe("/learn/my-placements");
});
