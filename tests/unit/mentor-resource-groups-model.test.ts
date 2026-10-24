import {describe,expect,it} from "vitest";
import {mentorResourceGroupKey,mentorResourceGroupLabel,
 mentorResourceGroupOrder} from "@/modules/projects/mentor-resource-groups-model";
const sprints=[
 {id:"old",label:"Sprint 11",status:"COMPLETED"},
 {id:"current",label:"Sprint 12",status:"ACTIVE"},
 {id:"next",label:"Sprint 13",status:"PLANNED"},
];
const rows=[
 {id:"earlier",sprintId:"old",pinned:false,sequence:1},
 {id:"whole",sprintId:null,pinned:false,sequence:2},
 {id:"future",sprintId:"next",pinned:false,sequence:3},
 {id:"pinned",sprintId:"old",pinned:true,sequence:4},
 {id:"active",sprintId:"current",pinned:false,sequence:5},
];
describe("Mentor resource directory sprint hierarchy",()=>{
 it("shows pinned, active, planned, earlier and whole project in that order",()=>{
  expect(mentorResourceGroupOrder(rows,sprints).map(row=>row.id))
    .toEqual(["pinned","active","future","earlier","whole"]);
  expect(rows[0]?.id).toBe("earlier");
 });
 it("labels recorded sprint groups and preserves whole-project identity",()=>{
  expect(mentorResourceGroupLabel(
    mentorResourceGroupKey(rows[4]!,true,sprints),sprints)).toBe("Sprint 12");
  expect(mentorResourceGroupKey(rows[1]!,true,sprints)).toBe("WHOLE");
  expect(mentorResourceGroupLabel("WHOLE",sprints)).toBe("Whole project");
 });
 it("keeps pinned separate even when pinned file belongs to past sprint",()=>{
  expect(mentorResourceGroupKey(rows[3]!,true,sprints)).toBe("PINNED");
  expect(mentorResourceGroupKey(rows[0]!,false,sprints)).toBe("OTHER");
 });
 it("does not map an unknown sprint to another project's sprint",()=>{
  expect(mentorResourceGroupKey({
    id:"x",sprintId:"foreign",sequence:1,
  },true,sprints)).toBe("UNKNOWN");
 });
});
