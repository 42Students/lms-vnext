import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {buildTpoLegacyHomeRows} from "@/modules/placements/tpo-home-legacy-rows";
import {buildTpoLegacyNextUp} from "@/modules/placements/tpo-home-next-up";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO-home-09 persisted team attention",()=>{
 it("TPO-home-09 distinguishes an assigned ask from an unread message and routes it to My asks",()=>{
  const fixture={batch:null,hasUninvitedBatch:false,moreBatches:0,liveDrives:0,driveAttention:0,
   driveDetail:null,driveHref:"/tpo/placements",registered:null,placedUnique:null,
   recruiterLeads:null,followUps:null,recruiterAccess:null,pendingRequests:0,messages:0,
   teamAsks:3,teamMentions:null,teamUnread:2,upcoming:[],calendarAvailable:false};
  const team=buildTpoLegacyHomeRows(fixture).find(item=>item.key==="team");
  expect(team?.needsAttention).toBe(true);
  expect(team?.href).toBe("/tpo/team?filter=me");
  expect(team?.status).toContain("3 asks");
 });
 it("TPO-home-09 computes only verified ask counts and never fabricates mentions from messages",()=>{
  const page=source("src/app/(authenticated)/tpo/home/page.tsx");
  expect(page).toContain('teamThreads.asksReady&&!teamThreads.hasMore');
  expect(page).toContain("item.asksForMe");
  expect(page).toContain("teamMentions:null");
  expect(page).toContain('type:"TEAM_ASKS",priority:1');
  expect(page).toContain('type:"TEAM_MESSAGES",priority:4');
 });
 it("TPO-home-09 reserves the higher urgency for assigned work",()=>{
  const next=buildTpoLegacyNextUp({
   needsYou:[{type:"TEAM_MESSAGES",priority:4,title:"Team messages",count:2,link:"/tpo/team"},
    {type:"TEAM_ASKS",priority:1,title:"Assigned ask",count:1,link:"/tpo/team?filter=me"}],
   batches:[],checklist:[],
  });
  expect(next?.action).toBe("See what you were asked");
  expect(next?.href).toBe("/tpo/team?filter=me");
 });
});
