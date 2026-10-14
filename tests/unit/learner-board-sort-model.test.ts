import {describe,it,expect} from "vitest";
import {sortLearnerBoardTasks} from "@/modules/projects/learner-board-sort-model";
const task=(id:string,title:string,priority:string,when:number)=>({id,title,priority,updatedAt:new Date(when)});
const rows=[task("a","Zulu","LOW",1),task("b","Alpha","CRITICAL",2),task("c","Beta","HIGH",3)];
describe("learner scoped Board sorting",()=>{
 it("orders priority with critical first and keeps input untouched",()=>{
  expect(sortLearnerBoardTasks(rows,"PRIORITY").map(x=>x.id)).toEqual(["b","c","a"]);
  expect(rows[0]?.id).toBe("a");
 });
 it("supports persisted recency and title sorting without inventing task status",()=>{
  expect(sortLearnerBoardTasks(rows,"RECENT").map(x=>x.id)).toEqual(["c","b","a"]);
  expect(sortLearnerBoardTasks(rows,"TITLE").map(x=>x.id)).toEqual(["b","c","a"]);
  expect(sortLearnerBoardTasks(rows,"DEFAULT").map(x=>x.id)).toEqual(["a","b","c"]);
 });
});
