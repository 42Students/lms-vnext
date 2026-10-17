import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {learnerRoadmapEmptyState} from "@/modules/courses/learner-roadmap-empty-state-model";
import {learnerPlacementHeroPriority} from "@/modules/placements/learner-dashboard-hero-priority-model";
import {liveSessionCountdown} from "@/components/courses/learner-live-session-status";
import {resourceInteractionState} from "@/components/courses/learner-interaction-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-15 reassigned learner course and placement parity",()=>{
 it("LEARNER-course-detail-08 resource and live session manual completion use confirmation",()=>{
  expect(resourceInteractionState({type:"RESOURCE",externalUrl:null,storageKey:null,progressStatus:"NOT_STARTED"}).canMarkComplete).toBe(true);
  expect(resourceInteractionState({type:"LIVE_CLASS",externalUrl:null,storageKey:null,progressStatus:"NOT_STARTED"}).canMarkComplete).toBe(true);
  expect(read("src/components/courses/resource-progress-control.tsx")).toContain("Finished with these materials?");
 });
 it("LEARNER-course-detail-09 live lesson has countdown and ended status",()=>{
  const s="2099-05-05T12:00:00Z",e="2099-05-05T13:00:00Z";
  expect(liveSessionCountdown(s,e,new Date("2099-05-05T11:00:00Z"))).toContain("Starts in");
  expect(liveSessionCountdown(s,e,new Date("2099-05-05T12:30:00Z"))).toBe("Live now");
  expect(liveSessionCountdown(s,e,new Date("2099-05-05T14:00:00Z"))).toBe("Ended");
 });
 it("LEARNER-course-detail-13 video progress reads the saved watched percentage",()=>{
  expect(read("src/components/courses/learner-course-workspace.tsx")).toContain("{content.progress.percentComplete}% watched");
 });
 it("LEARNER-course-detail-14 roadmap rows expose content kind and due labels",()=>{
  const s=read("src/components/courses/learner-roadmap-item-dialog.tsx");
  expect(s).toContain("{caption ?? kind}");
  expect(s).toContain("dueText ?");
 });
 it("LEARNER-course-detail-15 status and padded lesson index reflect next unfinished item",()=>{
  const s=read("src/components/courses/learner-course-workspace.tsx");
  expect(s).toContain("Continue here");
  expect(s).toContain('padStart(2, "0")');
 });
 it("LEARNER-course-detail-16 focused lesson has accessible previous next and return",()=>{
  const s=read("src/components/courses/learner-course-workspace.tsx");
  for(const copy of ["Back to Learning Path","Previous lesson","Next lesson"])expect(s).toContain(copy);
 });
 it("LEARNER-course-detail-20 published roadmap empty state uses exact legacy copy",()=>{
  expect(learnerRoadmapEmptyState(true,[])).toEqual({title:"No roadmap items yet",description:"Create lessons and add content to show the learner roadmap."});
  expect(learnerRoadmapEmptyState(true,[{items:[]}])?.title).toBe("No content in this lesson yet.");
  expect(learnerRoadmapEmptyState(false,[])?.title).toBe("Learning path is being prepared");
 });
 it("LEARNER-placements-03 placement tabs render content without extra PageHeader",()=>{
  for(const sub of ["applications","jobs","placement"]){
   expect(read("src/app/(authenticated)/learn/my-placements/"+sub+"/page.tsx")).not.toContain("<PageHeader");
  }
 });
 it("LEARNER-placements-05 recorded offer and registration decisions determine hero",()=>{
  const base={registration:null,acceptedOffer:false,fallback:null};
  expect(learnerPlacementHeroPriority({...base,pendingOffers:1})?.label).toBe("You have an offer");
  expect(learnerPlacementHeroPriority({pendingOffers:0,registration:{stage:"OPEN",choice:null},acceptedOffer:false,fallback:null})?.label).toBe("First step");
  expect(learnerPlacementHeroPriority({pendingOffers:0,registration:{stage:"CLOSED",choice:"PLACEMENTS"},acceptedOffer:true,fallback:null})?.label).toBe("Congratulations");
 });
});