import {describe,it,expect} from "vitest";
import {learnerDueSoonNotices} from "@/modules/courses/learner-assignment-due-notice-model";
const now=new Date("2026-10-17T10:00:00Z");
describe("LEARNER-learning-misc-08 live assignment due notices",()=>{
 it("shows only unsubmitted upcoming deadlines on own authorized items",()=>{
  const list=[
   {id:"ready",title:"Lab",deliveryId:"own",dueAt:new Date(now.getTime()+30000),submissionId:null},
   {id:"submitted",title:"Done",deliveryId:"own",dueAt:new Date(now.getTime()+30000),submissionId:"s"},
   {id:"missing",title:"Missing",deliveryId:"own",dueAt:null,submissionId:null},
   {id:"old",title:"Expired",deliveryId:"own",dueAt:new Date(now.getTime()-30000),submissionId:null},
  ];
  expect(learnerDueSoonNotices(list,now).map(item=>item.key)).toEqual(["ready:own"]);
 });
 it("does not treat deadlines after 48h as urgent",()=>{
  const list=[{id:"late",title:"Later",deliveryId:"own",dueAt:new Date(now.getTime()+72*3600000),submissionId:null}];
  expect(learnerDueSoonNotices(list,now)).toHaveLength(0);
 });
});
