import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerApplicationHistoryTimeline} from "@/modules/placements/learner-application-detail-model";
function src(path:string){return readFileSync(new URL("../../"+path,import.meta.url),"utf8");}
describe("learner application detail and own withdrawal contract",()=>{
  it("orders recorded status changes and never invents internal reasons",()=>{
    const rows=[
      {id:"2",fromStatus:"SUBMITTED",toStatus:"WITHDRAWN",occurredAt:new Date("2026-10-14T00:00:00Z")},
      {id:"1",fromStatus:null,toStatus:"SUBMITTED",occurredAt:new Date("2026-10-10T00:00:00Z")},
    ];
    expect(learnerApplicationHistoryTimeline(rows).map(x=>x.toStatus)).toEqual(["SUBMITTED","WITHDRAWN"]);
  });
  it("preserves same-origin existing withdrawal action and scoped status history",()=>{
    const page=src("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx");
    const control=src("src/components/placements/learner-application-detail-withdraw.tsx");
    const action=src("src/app/api/placements/applications/[applicationId]/actions/route.ts");
    expect(page).toContain("getOwnLearnerApplicationHistory");
    expect(page).toContain("currentStatus");
    expect(control).toContain("learnerApplicationWithdrawalSchema.safeParse");
    expect(control).toContain("Confirm withdrawal");
    expect(control).toContain("maxLength={2000}");
    expect(action).toContain("isSameOriginRequest");
  });
});
