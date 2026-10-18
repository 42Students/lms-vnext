import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 actor:vi.fn(),exists:vi.fn(),persisted:vi.fn(),db:vi.fn(),
 rows:[] as unknown[][],updates:[] as unknown[],audit:[] as unknown[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:state.actor,
}));
vi.mock("@/modules/placements/staged-tables",()=>({
 placementTableExists:state.exists,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:state.persisted,
}));
import {
 getTpoCommunicationSettings,updateTpoCommunicationSettings,
} from "@/modules/placements/tpo-communication-settings-service";

const college="00000000-0000-4000-8000-000000000001";
const version="2099-07-01T00:00:00.000Z";
const actor:RequestContext={
 user:{id:"tpo-staff",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"tpo-member",collegeId:college,organizationId:"org-a",status:"ACTIVE",roles:["TPO"]},
};
const valid={section:"SIGNATURE",emailSignature:"Office for Placements",expectedVersion:version} as const;
const existing={collegeId:college,emailSignature:"Old Signature",updatedAt:new Date(version)};

function db(){
 const tx={
  select:vi.fn(()=>({
   from:()=>({
    where:()=>({
     for:()=>({limit:async()=>state.rows.shift()??[]}),
     limit:async()=>state.rows.shift()??[],
    }),
   }),
  })),
  update:vi.fn(()=>({set:(data:unknown)=>{state.updates.push(data);return {
   where:()=>({returning:async()=>[{updatedAt:new Date("2099-07-01T00:00:00.001Z")}]})
  };}})),
  insert:vi.fn(()=>({values:async(data:unknown)=>{state.audit.push(data)}})),
 };
 state.db.mockReturnValue({transaction:(fn:(arg:typeof tx)=>Promise<unknown>)=>fn(tx)});
 return tx;
}

beforeEach(()=>{
 vi.clearAllMocks();state.rows=[];state.updates.length=0;state.audit.length=0;
 state.actor.mockResolvedValue(college);
 state.exists.mockResolvedValue(true);
 state.persisted.mockResolvedValue(undefined);
 db();
});

describe("TPO-settings-audit-55 communication settings service under retries and revocation",()=>{
 it("TPO-settings-audit-55 refuses forged/oversized settings changes before the actor or DB",async()=>{
  for(const payload of [
   {...valid,confirmed:true},
   {...valid,emailSignature:"x".repeat(301)},
   {...valid,expectedVersion:"not-a-timestamp"},
   {...valid,collegeId:"attacker"},
   {section:"SMS_CAP",smsMonthlyCap:-1,expectedVersion:null},
  ])await expect(updateTpoCommunicationSettings(actor,payload)).rejects.toThrow();
  expect(state.actor).not.toHaveBeenCalled();
  expect(state.db).not.toHaveBeenCalled();
 });
 it("TPO-settings-audit-55 rejects revoked TPO or unavailable schema without a transactional write",async()=>{
  state.actor.mockRejectedValueOnce(new Error("REVOKED_ROLE"));
  await expect(updateTpoCommunicationSettings(actor,valid)).rejects.toThrow("REVOKED_ROLE");
  expect(state.db).not.toHaveBeenCalled();
  state.exists.mockResolvedValueOnce(false);
  await expect(updateTpoCommunicationSettings(actor,valid)).rejects.toMatchObject({code:"TPO_SETTINGS_PENDING"});
  expect(state.db).not.toHaveBeenCalled();
 });
 it("TPO-settings-audit-55 renders truthful unregistered storage without querying rows",async()=>{
  state.exists.mockResolvedValueOnce(false);
  const result=await getTpoCommunicationSettings(actor);
  expect(result).toMatchObject({ready:false,version:null,smsMonthlyCap:500});
  expect(state.db).not.toHaveBeenCalled();
 });
 it("TPO-settings-audit-55 rejects concurrent revocation before any setting/audit update",async()=>{
  state.rows=[[{organizationId:"org-a"}],[existing]];
  state.persisted.mockRejectedValueOnce(new Error("ROLE_REVOKED_DURING_WRITE"));
  await expect(updateTpoCommunicationSettings(actor,valid)).rejects.toThrow("ROLE_REVOKED_DURING_WRITE");
  expect(state.updates).toHaveLength(0);
  expect(state.audit).toHaveLength(0);
 });
 it("TPO-settings-audit-55 rejects stale value changes and emits no activity event",async()=>{
  state.rows=[[{organizationId:"org-a"}],[existing]];
  await expect(updateTpoCommunicationSettings(actor,{
   ...valid,expectedVersion:"2099-07-01T00:00:01.000Z",
  })).rejects.toMatchObject({code:"TPO_SETTINGS_STALE"});
  expect(state.updates).toHaveLength(0);
  expect(state.audit).toHaveLength(0);
 });
 it("TPO-settings-audit-55 makes identical retries no-op even when their CAS token expired",async()=>{
  state.rows=[[{organizationId:"org-a"}],[existing]];
  const result=await updateTpoCommunicationSettings(actor,{
   ...valid,emailSignature:existing.emailSignature,expectedVersion:null,
  });
  expect(result).toEqual({saved:true,version});
  expect(state.updates).toHaveLength(0);
  expect(state.audit).toHaveLength(0);
 });
 it("TPO-settings-audit-55 writes changed section and audit only after scoped live actor and matching CAS",async()=>{
  state.rows=[[{organizationId:"org-a"}],[existing]];
  const result=await updateTpoCommunicationSettings(actor,valid);
  expect(result).toEqual({saved:true,version:"2099-07-01T00:00:00.001Z"});
  expect(state.persisted).toHaveBeenCalledWith(expect.anything(),actor,"placements.manage",{
   collegeId:college,organizationId:"org-a",
  });
  expect(state.updates).toHaveLength(1);
  expect(state.audit).toHaveLength(1);
  expect(state.audit[0]).toMatchObject({
   collegeId:college,eventType:"placements.tpo_communication_setting.updated",
   actorUserId:actor.user.id,
  });
 });
});
