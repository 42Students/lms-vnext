import { describe, expect, it } from "vitest";
import { learnerScheduleResetFilters } from "@/modules/academics/learner-schedule-filter-reset-model";
describe("learner Class Schedule filter recovery",()=>{
  it("restores only owned/authorized delivery selections",()=>{
    expect(learnerScheduleResetFilters([{deliveryId:"own-1"},{deliveryId:"own-2"},{deliveryId:"own-1"}])).toEqual({search:"",kind:"ALL",sectionId:"",upcomingOnly:false,deliveryIds:["own-1","own-2"]});
  });
  it("does not guess a delivery for an empty authorized set",()=>{expect(learnerScheduleResetFilters([]).deliveryIds).toEqual([]);});
});
