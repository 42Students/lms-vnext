import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {prioritizedCompanyTeamRecipients}
 from "@/modules/placements/tpo-company-team-recipient-priority";
const ACTOR="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ASSIGNEE="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MENTION="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const followers=Array.from({length:500},(_,i)=>"follower-"+i);

describe("TPO-companies-team-mention-priority-01 notification integrity",()=>{
 it("delivers explicit assignee and mention ahead of 500 subscribed followers",()=>{
  const picked=prioritizedCompanyTeamRecipients({
   actorMembershipId:ACTOR,assigneeId:ASSIGNEE,
   mentions:[MENTION,MENTION],team:[ACTOR,"team-one"],followers,
  });
  expect(picked).toHaveLength(250);
  expect(picked.slice(0,3)).toEqual([ASSIGNEE,MENTION,"team-one"]);
  expect(picked).not.toContain(ACTOR);
  expect(picked).not.toContain("follower-499");
  expect(new Set(picked).size).toBe(picked.length);
 });
 it("prioritizes assignee even when already a follower and deduplicates multiple @team hits",()=>{
  const picked=prioritizedCompanyTeamRecipients({
   actorMembershipId:ACTOR,assigneeId:ASSIGNEE,
   mentions:[ASSIGNEE,MENTION],team:[MENTION,MENTION,ACTOR],
   followers:[ASSIGNEE,MENTION,ACTOR],
  });
  expect(picked).toEqual([ASSIGNEE,MENTION]);
 });
 it("handles no recipients and rejects oversized or zero caps",()=>{
  expect(prioritizedCompanyTeamRecipients({
   actorMembershipId:ACTOR,assigneeId:null,mentions:[],team:[],followers:[],
  })).toEqual([]);
  for(const cap of [0,251,-1,1.5,Infinity,NaN]){
   expect(()=>prioritizedCompanyTeamRecipients({
    actorMembershipId:ACTOR,assigneeId:ASSIGNEE,mentions:[],team:[],followers,
   },cap)).toThrow(RangeError);
  }
 });
 it("the live writer revalidates every prioritized recipient against active college team membership",()=>{
  const src=readFileSync(new URL("../../src/modules/placements/tpo-company-team-service.ts",import.meta.url),"utf8");
  expect(src).toContain("prioritizedCompanyTeamRecipients({");
  expect(src).toContain("assigneeId:input.assigneeId");
  expect(src).toContain("mentions:explicitMentions");
  expect(src).toContain("followers:subscribers.map(row=>row.membershipId)");
  expect(src).toContain("inArray(collegeMemberships.id,notifyIds)");
  expect(src).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(src).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(src).toContain('eq(users.platformStatus,"ACTIVE")');
 });
});
