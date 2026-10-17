import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerWaitingOnYou} from "@/modules/placements/learner-waiting-on-you-model";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Chat-7 placement dashboard attention cues",()=>{
 it("LEARNER-placements-04 prompts actual sent-back profile fixes",()=>{
  const list=learnerWaitingOnYou({pendingOffers:0,urgentAssessment:null,urgentInterview:null,nextAction:null,
   profileFixes:[{label:"Correct identity details",href:"/learn/profile?section=identity"},
    {label:"Correct education details",href:"/learn/profile?section=education"}]});
  expect(list.map(item=>item.label)).toEqual(["Correct identity details","Correct education details"]);
  expect(list.every(item=>item.priority==="URGENT")).toBe(true);
  expect(read("src/app/(authenticated)/learn/my-placements/page.tsx")).toContain("profileFixes={verificationCue?.editHrefs??[]}");
 });
 it("LEARNER-placements-09 shows real personal updates without conflating them with college notices",()=>{
  const page=read("src/app/(authenticated)/learn/my-placements/page.tsx");
  expect(page).toContain("getOwnLearnerPlacementAlerts(context,{limit:3})");
  expect(page).toContain("Latest personal updates");
  expect(page).toContain("Latest from the placement cell");
  expect(page).toContain("personalNoticeRead.available");
  expect(page).toContain("alert.actionHref");
 });
});
