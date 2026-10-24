import {describe,it,expect} from "vitest";
import {selectMentorAttention} from "@/modules/projects/mentor-attention-kind-model";
import type {MentorProjectAttention} from "@/modules/projects/mentor-attention";
const item=(key:string,kind:MentorProjectAttention["kind"],occurredAt:string)=>
 ({key,kind,projectId:"p",occurredAt}) as MentorProjectAttention;
const rows=[
 item("request","REQUESTED","2026-10-24T12:00:00Z"),
 item("review","REVIEW","2026-10-24T10:00:00Z"),
 item("blocked","TASK_BLOCKED","2026-10-24T11:00:00Z"),
];
describe("Mentor notification order selection",()=>{
 it("RECENT retains the latest event first",()=>{
  expect(selectMentorAttention(rows,"ALL",undefined,"RECENT").map(x=>x.key))
    .toEqual(["request","blocked","review"]);
 });
 it("REVIEW_FIRST puts review and blockers first",()=>{
  expect(selectMentorAttention(rows,"ALL",undefined,"REVIEW_FIRST").map(x=>x.key))
    .toEqual(["review","blocked","request"]);
 });
});
