import {describe,expect,it} from "vitest";
import {tpoStudentNoticesOverview} from "@/modules/placements/tpo-student-notices-overview-model";

describe("TPO-settings-audit-NOTICES-COUNT-02 honest college notice totals",()=>{
 it("shows exact or bounded known counts without inventing more records",()=>{
  expect(tpoStudentNoticesOverview({announcementsReady:true,noticeCount:0,prepReady:true}).publishedSummary)
   .toBe("0 recorded college notices");
  expect(tpoStudentNoticesOverview({announcementsReady:true,noticeCount:4,prepReady:true,hasMore:true}).publishedSummary)
   .toBe("At least 5 recorded college notices");
  expect(tpoStudentNoticesOverview({announcementsReady:true,noticeCount:Number.MAX_SAFE_INTEGER,prepReady:true,hasMore:true}).publishedSummary)
   .toBe("At least "+Number.MAX_SAFE_INTEGER+" recorded college notices");
 });

 it("never presents bad numbers as zero, including when source claims ready",()=>{
  for(const count of [-5,0.5,Number.NaN,Number.POSITIVE_INFINITY,Number.MAX_SAFE_INTEGER+1]){
   for(const hasMore of [false,true]){
    const result=tpoStudentNoticesOverview({
     announcementsReady:true,noticeCount:count,prepReady:false,hasMore,
    });
    expect(result.publishedSummary).toBe("College notices unavailable");
    expect(result.prepSummary).toBe("Preparation configuration unavailable");
    expect(result.noticeHref).toBe("/tpo/announcements");
   }
  }
 });

 it("does not leak a count when the notice source is unavailable",()=>{
  for(const count of [0,25,Number.MAX_SAFE_INTEGER]){
   const result=tpoStudentNoticesOverview({
    announcementsReady:false,noticeCount:count,prepReady:true,hasMore:true,
   });
   expect(result.publishedSummary).toBe("College notices unavailable");
   expect(result.prepSummary).toBe("Preparation-readiness configuration available");
  }
 });
});
