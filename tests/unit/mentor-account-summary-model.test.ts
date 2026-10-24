import {describe,expect,it} from "vitest";
import {mentorAccountAssignments} from
 "@/modules/projects/mentor-account-summary-model";
describe("Mentor account assigned teams and current college courses",()=>{
 it("deduplicates projects and course names without inflating multiple roles",()=>{
  const rows=[
   {id:"p1",courseLabel:"Computing",memberRole:"MENTOR",collegeId:"c1"},
   {id:"p1",courseLabel:"Computing",memberRole:"MENTOR",collegeId:"c1"},
   {id:"p2",courseLabel:"Networking",memberRole:"MENTOR",collegeId:"c1"},
   {id:"p3",courseLabel:"Computing",memberRole:"LEARNER",collegeId:"c1"},
  ];
  expect(mentorAccountAssignments(rows,"c1")).toEqual({
   teamCount:2,courses:["Computing","Networking"],
  });
 });
 it("does not include the same user’s other college or non-Mentor work",()=>{
  const rows=[
   {id:"outside",courseLabel:"Private",memberRole:"MENTOR",collegeId:"c2"},
   {id:"teacher",courseLabel:"Teaching",memberRole:"FACULTY",collegeId:"c1"},
  ];
  expect(mentorAccountAssignments(rows,"c1")).toEqual({
   teamCount:0,courses:[],
  });
 });
 it("ignores missing labels without inventing a course",()=>{
  expect(mentorAccountAssignments([
   {id:"p1",courseLabel:" ",memberRole:"MENTOR",collegeId:"c1"},
   {id:"p2",courseLabel:null,memberRole:"MENTOR",collegeId:"c1"},
  ],"c1")).toEqual({teamCount:2,courses:[]});
 });
});
