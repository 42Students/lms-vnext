
import {expect,it} from "vitest";
import {deriveMentorProjectAttention} from "@/modules/projects/mentor-attention";
it("treats project history as an explicit scoped activity signal, never another project event",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 const row={projectId:"11111111-1111-4111-8111-111111111111",
 projectTitle:"Capstone",projectStatus:"ACTIVE",projectUpdatedAt:new Date("2026-10-01T00:00:00Z"),
 lastActivityAt:new Date("2026-10-14T00:00:00Z"),submission:null,meetings:[]};
 expect(deriveMentorProjectAttention([row],now).some(a=>a.kind==="STALLED")).toBe(false);
 expect(deriveMentorProjectAttention([{...row,lastActivityAt:new Date("2026-10-02T00:00:00Z")}],now)
  .some(a=>a.kind==="STALLED")).toBe(true);
});
