import { describe,expect,it } from "vitest";
import {
  learnerPlacementNotificationInputSchema,
  placementNotificationChanges,
  placementNotificationIsStale,
} from "@/modules/placements/learner-placement-notification-model";

const before={notifyMatchingJobs:true,notifyApplicationUpdates:false};
describe("Learner placement-only notification choices",()=>{
  it("accepts only explicit confirmed boolean flags",()=>{
    expect(learnerPlacementNotificationInputSchema.parse({
      ...before,confirmed:true,expected:before,
    })).toEqual({...before,confirmed:true,expected:before});
    for(const value of [
      {...before,confirmed:false},
      {...before,confirmed:true,expected:before,collegeId:"foreign"},
      {...before,confirmed:true,expected:before,membershipId:"other"},
      {notifyMatchingJobs:"false",notifyApplicationUpdates:true,confirmed:true},
      {notifyMatchingJobs:false,confirmed:true},
    ]) {
      expect(learnerPlacementNotificationInputSchema.safeParse(value).success).toBe(false);
    }
  });
  it("detects true changes and no-ops to avoid fake audit events",()=>{
    expect(placementNotificationChanges(before,{...before,confirmed:true,expected:before})).toBe(false);
    expect(placementNotificationChanges(before,{
      notifyMatchingJobs:false,notifyApplicationUpdates:false,confirmed:true,expected:before,
    })).toBe(true);
    expect(placementNotificationChanges(before,{
      notifyMatchingJobs:true,notifyApplicationUpdates:true,confirmed:true,expected:before,
    })).toBe(true);
  });
});

it("rejects stale saved flags while ignoring unrelated candidate settings",()=>{
  expect(placementNotificationIsStale(before,before)).toBe(false);
  expect(placementNotificationIsStale(before,{notifyMatchingJobs:false,notifyApplicationUpdates:false})).toBe(true);
  expect(placementNotificationIsStale(before,{notifyMatchingJobs:true,notifyApplicationUpdates:true})).toBe(true);
});
