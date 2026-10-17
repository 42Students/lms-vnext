import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {buildTpoLegacyHomeRows,type TpoHomeSummary} from "@/modules/placements/tpo-home-legacy-rows";
import {buildTpoLegacyNextUp} from "@/modules/placements/tpo-home-next-up";
import {tpoHomeGreeting} from "@/modules/placements/tpo-home-greeting-model";

const fixed=new Date("2099-07-01T02:00:00.000Z");
const base:TpoHomeSummary={
 batch:null,moreBatches:0,liveDrives:0,driveAttention:0,
 registered:null,placedUnique:null,recruiterLeads:null,followUps:null,
 recruiterAccess:null,pendingRequests:0,messages:null,
 teamAsks:null,teamMentions:null,teamUnread:null,upcoming:[],
};
const rows=(overrides:Partial<TpoHomeSummary>)=>buildTpoLegacyHomeRows({...base,...overrides},fixed);
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-4 verified TPO Home gap coverage",()=>{
 it("TPO-home-01 uses an IST date and the persisted user's first-name greeting",()=>{
  const morning=tpoHomeGreeting(fixed,"Ananya Rao");
  expect(morning.title).toBe("Good morning, Ananya");
  expect(morning.date).toMatch(/, 1 July/);
  expect(tpoHomeGreeting(new Date("2099-07-01T09:00:00.000Z"),"Ananya").title).toBe("Good afternoon, Ananya");
  expect(tpoHomeGreeting(new Date("2099-07-01T15:00:00.000Z"),"Ananya").title).toBe("Good evening, Ananya");
  expect(tpoHomeGreeting(fixed,null).title).toBe("Good morning");
  expect(source("src/app/(authenticated)/tpo/home/page.tsx")).toContain("profileRows[0]?.displayName");
 });
 it("TPO-home-05 shows live drives, requests and the request action",()=>{
  const row=rows({liveDrives:2,driveAttention:3,driveDetail:"3 requests",
   driveHref:"/tpo/placements?tab=requests"})[1];
  expect(row).toMatchObject({title:"Drives",status:"2 live · 3 requests",
   href:"/tpo/placements?tab=requests",needsAttention:true});
 });
 it("TPO-home-06 shows the registered and placed learner counts",()=>{
  const row=rows({registered:10,placedUnique:4})[2];
  expect(row).toMatchObject({title:"Students",status:"10 registered · 4 placed",
   href:"/tpo/students",needsAttention:false});
  expect(rows({registered:0,placedUnique:0})[2].status).toBe("Nobody registered yet");
 });
 it("TPO-home-07 shows recruiter and due follow-up workload",()=>{
  const row=rows({recruiterLeads:3,followUps:2,recruiterAccess:1})[3];
  expect(row).toMatchObject({title:"Engage",status:"3 recruiters · 2 follow-ups today",
   href:"/tpo/recruiters?due=1",needsAttention:true});
 });
 it("TPO-home-08 combines inbox requests and recruiter messages",()=>{
  const row=rows({pendingRequests:2,messages:1})[4];
  expect(row).toMatchObject({title:"Inbox",status:"2 requests · 1 message to answer",
   href:"/tpo/requests",needsAttention:true});
  expect(rows({pendingRequests:0,messages:0})[4].status).toBe("No requests or messages waiting");
 });
 it("TPO-home-09 prioritizes team asks and the personal team inbox",()=>{
  const row=rows({teamAsks:2,teamMentions:1,teamUnread:4})[5];
  expect(row).toMatchObject({title:"Team",status:"2 asks for you",
   href:"/tpo/team?filter=me",needsAttention:true});
 });
 it("TPO-home-13 shows the first undone setup step when no need cards exist",()=>{
  const next=buildTpoLegacyNextUp({needsYou:[],batches:[],checklist:[
   {label:"Decide who is in placements",done:true},
   {label:"Invite a batch to register",done:false,link:"/tpo/batches"},
  ]});
  expect(next).toEqual({title:"Invite a batch to register",
   text:"Setting up placements: 1 step left.",action:"Start",href:"/tpo/batches"});
 });
 it("TPO-home-42 polls scoped sidebar counters while visible",()=>{
  const src=source("src/components/shell/sidebar-nav.tsx");
  expect(src).toContain("/api/tpo/shell-counts");
  expect(src).toContain("60000");
  expect(src).toContain('visibilitychange');
 });
 it("TPO-home-43 renders five legacy mobile-footer destinations",()=>{
  const src=source("src/components/tpo/tpo-mobile-footer.tsx");
  for(const label of ["Home","Engage","Drives","Students","More"])
   expect(src).toContain('label:"'+label+'"');
  expect(source("src/app/(authenticated)/tpo/layout.tsx")).toContain("<TpoMobileFooter/>");
 });
});
