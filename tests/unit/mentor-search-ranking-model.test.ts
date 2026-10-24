import {describe,expect,it} from "vitest";
import {mentorSearchRank,mentorSearchHighlightParts,
 sortMentorSearchMatches} from "@/modules/projects/mentor-search-ranking-model";
describe("Authorized Mentor search result presentation",()=>{
 it("ranks exact before prefix before substring, independent of SQL row order",()=>{
  const rows=[
   {key:"3",title:"API project notes",context:"Team A"},
   {key:"2",title:"Api board",context:"Team A"},
   {key:"1",title:"api",context:"Team B"},
   {key:"4",title:"Zeta",context:"Team C"},
  ];
  const result=sortMentorSearchMatches(rows,"API");
  expect(result.map(row=>row.key)).toEqual(["1","2","3","4"]);
  expect(rows[0]?.key).toBe("3");
  expect(mentorSearchRank("API","api")).toBe(0);
 });
 it("renders repeated matching text as safe span/mark parts",()=>{
  expect(mentorSearchHighlightParts("<b>React</b> React","react"))
    .toEqual([
      {text:"<b>",highlight:false},
      {text:"React",highlight:true},
      {text:"</b> ",highlight:false},
      {text:"React",highlight:true},
    ]);
 });
 it("avoids ambiguous index offsets under Unicode case-fold length changes",()=>{
  expect(mentorSearchHighlightParts("İstanbul","i"))
   .toEqual([{text:"İstanbul",highlight:false}]);
 });
 it("never uses empty input as a global highlight",()=>{
  expect(mentorSearchHighlightParts("Mentor","   "))
    .toEqual([{text:"Mentor",highlight:false}]);
 });
});
