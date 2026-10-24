import {describe,expect,it} from "vitest";
import {selectMentorPerformanceSprints} from
  "@/modules/projects/mentor-performance-range-model";

const sprints=[
  {id:"first-r1",releaseId:"r1",status:"COMPLETED",sequence:0},
  {id:"second-r1",releaseId:"r1",status:"COMPLETED",sequence:1},
  {id:"first-r2",releaseId:"r2",status:"COMPLETED",sequence:0},
  {id:"active-r2",releaseId:"r2",status:"ACTIVE",sequence:1},
  {id:"future-r2",releaseId:"r2",status:"PLANNED",sequence:2},
];
const lastFour=new Set(["second-r1","first-r2","active-r2","future-r2"]);
const select=(range:string,picked:readonly string[]=[])=>
  selectMentorPerformanceSprints(sprints,range,lastFour,picked).map(row=>row.id);

describe("Mentor Performance range selection",()=>{
  it("selects sprint IDs rather than ambiguous release-local sequence numbers",()=>{
    expect(select("picked",["first-r2","first-r1"])).toEqual([
      "first-r1","first-r2",
    ]);
    expect(select("release:r2")).toEqual([
      "first-r2","active-r2","future-r2",
    ]);
    expect(select("first-r2")).toEqual(["first-r2"]);
  });
  it("preserves chronological order, ignores duplicates and unknown IDs",()=>{
    expect(select("picked",["active-r2","forged-foreign","active-r2","second-r1"]))
      .toEqual(["second-r1","active-r2"]);
    expect(select("picked",[])).toEqual([]);
    expect(select("release:foreign")).toEqual([]);
  });
  it("supports active, recent and whole-project ranges without fabricating work",()=>{
    expect(select("current")).toEqual(["active-r2"]);
    expect(select("last4")).toEqual([
      "second-r1","first-r2","active-r2","future-r2",
    ]);
    expect(select("whole")).toEqual(sprints.map(row=>row.id));
    expect(select("all")).toEqual([]);
    const noActive=sprints.map(row=>({...row,status:"COMPLETED"}));
    expect(selectMentorPerformanceSprints(noActive,"current",lastFour,[]))
      .toEqual([]);
  });
});
