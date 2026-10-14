import { describe,expect,it } from "vitest";
import {sortLearnerProjectRows} from "@/modules/projects/learner-project-sort-model";
const make=(id:string,title:string,status:string,time:number)=>({project:{id,title,status,updatedAt:new Date(time)}});
const rows=[make("1","Zulu","ACTIVE",1),make("2","Alpha","ACTIVE",2),make("3","Archived","ARCHIVED",3)];
describe("learner project list sorting",()=>{
 it("keeps archives last and sorts visible projects by title",()=>{
  expect(sortLearnerProjectRows(rows,"TITLE",new Map()).map(x=>x.project.id)).toEqual(["2","1","3"]);
 });
 it("handles unknown progress without inventing zero progress",()=>{
  const p=new Map([["1",{percentage:20}],["2",{percentage:80}]]);
  expect(sortLearnerProjectRows(rows,"PROGRESS",p).map(x=>x.project.id)).toEqual(["1","2","3"]);
  expect(sortLearnerProjectRows(rows,"INVALID",p).map(x=>x.project.id)).toEqual(["2","1","3"]);
  expect(rows[0].project.id).toBe("1");
 });
});
