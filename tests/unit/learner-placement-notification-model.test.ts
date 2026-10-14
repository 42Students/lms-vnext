import { describe,expect,it } from "vitest";
import {
  learnerPlacementNotificationInputSchema,
  placementNotificationChanges,
} from "@/modules/placements/learner-placement-notification-model";

const before={notifyMatchingJobs:true,notifyApplicationUpdates:false};
describe("Learner placement-only notification choices",()=>{
  it("accepts only explicit confirmed boolean flags",()=>{
    expect(learnerPlacementNotificationInputSchema.parse({
      ...before,confirmed:true,
    })).toEqual({...before,confirmed:true});
    for(const value of [
      {...before,confirmed:false},
      {...before,confirmed:true,collegeId:"foreign"},
      {...before,confirmed:true,membershipId:"other"},
      {notifyMatchingJobs:"false",notifyApplicationUpdates:true,confirmed:true},
      {notifyMatchingJobs:false,confirmed:true},
    ]) {
      expect(learnerPlacementNotificationInputSchema.safeParse(value).success).toBe(false);
    }
  });
  it("detects true changes and no-ops to avoid fake audit events",()=>{
    expect(placementNotificationChanges(before,{...before,confirmed:true})).toBe(false);
    expect(placementNotificationChanges(before,{
      notifyMatchingJobs:false,notifyApplicationUpdates:false,confirmed:true,
    })).toBe(true);
    expect(placementNotificationChanges(before,{
      notifyMatchingJobs:true,notifyApplicationUpdates:true,confirmed:true,
    })).toBe(true);
  });
});
