import { describe, expect, it } from "vitest";
import { findOwnLearnerAssignment } from "@/modules/courses/learner-assignment-detail-model";
const assignmentId = "81818181-8181-4818-8818-818181818181";
const first = "82828282-8282-4828-8828-828282828282";
const other = "83838383-8383-4838-8838-838383838383";
const rows = [{id:assignmentId,deliveryId:first,title:"Own class"}];
describe("own learner assignment selector",()=>{
  it("selects an exact authorized assignment and delivery",()=>{
    expect(findOwnLearnerAssignment(rows,{assignmentId,deliveryId:first})?.title).toBe("Own class");
    expect(findOwnLearnerAssignment(rows,{assignmentId,deliveryId:other})).toBeNull();
  });
  it("fails closed on invalid, forged, duplicate and absent selectors",()=>{
    for(const bad of [null,{assignmentId,deliveryId:"no"},{assignmentId,deliveryId:[first]},
      {assignmentId,deliveryId:first,collegeId:other},{assignmentId:other,deliveryId:first}]) {
      expect(findOwnLearnerAssignment(rows,bad)).toBeNull();
    }
  });
});