import {describe,it,expect} from "vitest";
import {filterLearnerBoardTasks} from "@/modules/projects/learner-project-board-model";
const task={id:"11111111-1111-4111-8111-111111111111",title:"Implement API",description:"Backend work",acceptanceCriteria:"Must handle idempotent retries",priority:"HIGH",sprintId:"22222222-2222-4222-8222-222222222222"};
describe("learner Board acceptance-criteria search",()=>{
 it("searches within the authenticated workspace's persisted acceptance criteria",()=>{
  expect(filterLearnerBoardTasks([task],"idempotent")).toEqual([task]);
  expect(filterLearnerBoardTasks([task],"idempotent",{priority:"LOW"})).toEqual([]);
 });
 it("handles tasks without authored criteria and bounds search input",()=>{
  expect(filterLearnerBoardTasks([{...task,acceptanceCriteria:null}],"idempotent")).toEqual([]);
  expect(filterLearnerBoardTasks([task],"x".repeat(101))).toEqual([task]);
 });
});
