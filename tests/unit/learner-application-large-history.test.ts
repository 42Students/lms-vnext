import {expect,it} from "vitest";
import {learnerApplicationLatestActivity} from "@/modules/placements/learner-applications-browse-model";
it("handles long persisted histories without spreading a huge array into Math.max",()=>{
 const date=new Date("2026-10-14T00:00:00Z");
 const item={applicationId:"owned",companyName:"Example",jobTitle:"Engineer",applicationStatus:"SUBMITTED",submittedAt:date,withdrawnAt:null,screening:{status:"UNDER_REVIEW",decidedAt:null},results:Array.from({length:100000},()=>({appliedAt:null}))};
 expect(learnerApplicationLatestActivity(item)).toBe(date.getTime());
 item.results[99999].appliedAt=date;
 expect(learnerApplicationLatestActivity(item)).toBe(date.getTime());
});
