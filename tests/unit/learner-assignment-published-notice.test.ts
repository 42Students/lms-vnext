import {describe,it,expect} from "vitest";
import {learnerAssignmentPublishedNotice} from "@/modules/courses/learner-assignment-notification-model";
describe("LEARNER-learning-misc-08 grade published bell",()=>{
 it("links to the exact delivery and omits private grade values",()=>{
  const row=learnerAssignmentPublishedNotice("assignment","delivery");
  expect(row.actionHref).toBe("/learn/allAssignments/assignment?deliveryId=delivery");
  expect(row.title).toBe("Assignment grade published");
  expect(row.body).not.toMatch(/points|score|[0-9]+\/[0-9]+/i);
 });
});
