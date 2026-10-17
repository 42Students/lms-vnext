import {describe,expect,it} from "vitest";
import {buildTpoLegacyHomeRows} from "@/modules/placements/tpo-home-legacy-rows";
import {buildTpoLegacyNextUp} from "@/modules/placements/tpo-home-next-up";
import {readFileSync} from "node:fs";
const empty={batch:{name:"Batch 1",invited:true,eligible:30,registered:20,placed:null},
 moreBatches:2,liveDrives:0,driveAttention:0,registered:null,placedUnique:null,
 recruiterLeads:null,followUps:null,recruiterAccess:null,pendingRequests:0,messages:null,
 teamAsks:null,teamMentions:null,teamUnread:null,upcoming:[]};
describe("TPO-home-R02 all-batch eligibility attention and invitation",()=>{
 it("marks placement eligibility when a later batch is uninvited",()=>{
  expect(buildTpoLegacyHomeRows({...empty,hasUninvitedBatch:true})[0]).toMatchObject({
   title:"Placement eligibility",needsAttention:true});
  expect(buildTpoLegacyHomeRows({...empty,hasUninvitedBatch:false})[0].needsAttention).toBe(false);
 });
 it("does not force the first batch into the invite when a later cohort is actionable",()=>{
  const next=buildTpoLegacyNextUp({needsYou:[{type:"REGISTRATION_CLOSED",
   title:"Invite the batch to register",priority:0,count:18,link:"/tpo/batches/later"}],
   batches:[{batchId:"later",name:"Batch 3",eligible:18,registered:9,invitedAt:null}],
   checklist:[]});
  expect(next?.action).toBe("Invite 9 students");
  expect(next?.href).toBe("/tpo/batches/later");
  const page=readFileSync(new URL("../../src/app/(authenticated)/tpo/home/page.tsx",import.meta.url),"utf8");
  // Home now checks invite candidates in bounded concurrent groups, not one
  // serial for-of loop; a full earlier batch must not hide an actionable later one.
  expect(page).toContain("for(let offset=0;offset<inviteCandidates.length;offset+=4)");
  expect(page).toContain("const candidates=inviteCandidates.slice(offset,offset+4)");
  expect(page).toContain("Promise.all(candidates.map(async candidate");
  expect(page).toContain("hasUninvitedBatch:batches.batches.some");
 });
});
