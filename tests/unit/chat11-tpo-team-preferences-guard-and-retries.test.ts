import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {planTpoThreadPreferenceChange} from "@/modules/placements/tpo-team-preference-state-model";
import {tpoTeamPreferenceActionSchema} from "@/modules/placements/tpo-team-preferences-service";

const now=new Date("2099-05-01T10:00:00.000Z");
const later=new Date("2099-05-02T10:00:00.000Z");
const threadId="11111111-1111-4111-8111-111111111111";

describe("TPO-settings-audit-PREF-TEAM-01 tenant-safe personal team preferences",()=>{
 it("rejects caller-supplied tenant/user/member identity and invalid actions",()=>{
  expect(tpoTeamPreferenceActionSchema.safeParse({threadId,action:"FOLLOW"}).success).toBe(true);
  for(const bad of [
   {threadId:"not-a-uuid",action:"MUTE"},
   {threadId,action:"DELETE"},
   {threadId,action:"FOLLOW",collegeId:threadId},
   {threadId,action:"FOLLOW",membershipId:threadId},
   {threadId,action:"FOLLOW",userId:threadId},
  ])expect(tpoTeamPreferenceActionSchema.safeParse(bad).success).toBe(false);
 });

 it("does not materialize defaults or write a duplicate on repeated FOLLOW/UNMUTE",()=>{
  expect(planTpoThreadPreferenceChange(null,"FOLLOW",now))
   .toEqual({following:true,mutedAt:null,changed:false});
  expect(planTpoThreadPreferenceChange(null,"UNMUTE",now))
   .toEqual({following:true,mutedAt:null,changed:false});
  const off=planTpoThreadPreferenceChange(null,"UNFOLLOW",now);
  expect(off).toEqual({following:false,mutedAt:null,changed:true});
  expect(planTpoThreadPreferenceChange(off,"UNFOLLOW",later).changed).toBe(false);
 });

 it("keeps original mute time across retries and retains follow state independently",()=>{
  const initial={following:false,mutedAt:null};
  const first=planTpoThreadPreferenceChange(initial,"MUTE",now);
  expect(first).toEqual({following:false,mutedAt:now,changed:true});
  const retry=planTpoThreadPreferenceChange(first,"MUTE",later);
  expect(retry).toEqual({following:false,mutedAt:now,changed:false});
  expect(retry.mutedAt).toBe(now);
  const reFollow=planTpoThreadPreferenceChange(retry,"FOLLOW",later);
  expect(reFollow).toEqual({following:true,mutedAt:now,changed:true});
  const unmute=planTpoThreadPreferenceChange(reFollow,"UNMUTE",later);
  expect(unmute).toEqual({following:true,mutedAt:null,changed:true});
  expect(planTpoThreadPreferenceChange(unmute,"UNMUTE",later).changed).toBe(false);
 });

 it("rebuilds persisted active TPO or College Admin team role inside both read and write transactions",()=>{
  const source=readFileSync("src/modules/placements/tpo-team-preferences-service.ts","utf8");
  expect(source.match(/hasPlacementTeamMembership\(persisted\)/g)).toHaveLength(2);
  expect(source.match(/assertPersistedPlatformPermission\(tx,context,"placements.manage"/g))
   .toHaveLength(2);
  expect(source).toContain("eq(placementTpoInternalThreads.collegeId,college.id)");
  expect(source).toContain("eq(placementTpoInternalReads.membershipId,member.id)");
  expect(source).toContain('for("share")');
  expect(source).toContain('for("update")');
  expect(source).toContain("if(!changed)return {following,muted:!!mutedAt}");
  expect(source).toContain("onConflictDoUpdate");
 });
});
