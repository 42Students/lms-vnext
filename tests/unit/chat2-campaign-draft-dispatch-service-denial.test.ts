import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const state=vi.hoisted(()=>({
  db:vi.fn(),
  scope:vi.fn(),
  roleAllowed:true,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/identity/context",()=>({
  hasMembershipRole:(_ctx:unknown, role:string)=>state.roleAllowed && role==="TPO",
}));
vi.mock("@/modules/placements/scope",()=>({
  requirePlacementManageScope:state.scope,
}));

import {
  createTpoCampaignDraft, getTpoCampaignDraft, listTpoCampaignDrafts,
  listTpoCampaignRecipientStatuses,
} from "@/modules/messaging/tpo-campaign-draft-service";
import { dispatchTpoCampaign, tpoCampaignDispatchReady } from "@/modules/messaging/tpo-campaign-dispatch-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const campaignId="22222222-2222-4222-8222-222222222222";
const leadId="33333333-3333-4333-8333-333333333333";
const actor={
  user:{id:"tpo-one",identityUid:"tpo-one",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"m1",collegeId,organizationId:"org-one",status:"ACTIVE",roles:["TPO"]},
} as RequestContext;
const draft={
  title:"Employer invitations",subject:"Join our placement drive",
  body:"Hello {name}, we look forward to hearing from {company}.",
  segment:"NEW" as const,templateKey:"tpo-campaign-general",
  selectedLeadIds:[leadId],
};

beforeEach(()=>{
  vi.clearAllMocks();
  state.roleAllowed=true;
  state.scope.mockResolvedValue({id:collegeId,organizationId:"org-one"});
  vi.stubEnv("DB09_TPO_API_READY","");
  vi.stubEnv("TPO_CAMPAIGNS_READY","");
});
afterEach(()=>vi.unstubAllEnvs());

describe("chat-2 TPO campaign draft and dispatch direct service denial paths",()=>{
  it("TPO-campaign-draft-SVC-01 rejects forged tenant IDs, unknown forms and empty recipient selection before DB or permissions",async()=>{
    for(const raw of [
      {...draft,collegeId:"attacker"},
      {...draft,selectedLeadIds:[]},
      {...draft,selectedLeadIds:[leadId,leadId]},
      {...draft,templateKey:"tpo-otp"},
      {...draft,body:""},
      {...draft,segment:"OTHER"},
      {...draft,title:"X".repeat(161)},
    ])await expect(createTpoCampaignDraft(actor,raw)).rejects.toThrow();
    expect(state.scope).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("TPO-campaign-draft-SVC-02 denies inactive and non-TPO actors before any CRM lookups",async()=>{
    const contexts=[
      {...actor,membership:null},
      {...actor,membership:{...actor.membership!,status:"SUSPENDED"}},
      {...actor,user:{...actor.user,platformStatus:"DISABLED"}},
    ] as RequestContext[];
    for(const candidate of contexts){
      await expect(createTpoCampaignDraft(candidate,draft)).rejects.toThrow();
      await expect(listTpoCampaignDrafts(candidate)).rejects.toThrow();
      await expect(getTpoCampaignDraft(candidate,campaignId)).rejects.toThrow();
      await expect(listTpoCampaignRecipientStatuses(candidate,campaignId)).rejects.toThrow();
    }
    state.roleAllowed=false;
    await expect(createTpoCampaignDraft(actor,draft)).rejects.toThrow();
    await expect(listTpoCampaignDrafts(actor)).rejects.toThrow();
    expect(state.scope).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("TPO-campaign-draft-SVC-03 does not create drafts or expose snapshots until registered storage is verified",async()=>{
    await expect(createTpoCampaignDraft(actor,draft)).rejects.toMatchObject({code:"NOT_READY"});
    expect(await listTpoCampaignDrafts(actor)).toEqual({ready:false,rows:[]});
    expect(await getTpoCampaignDraft(actor,campaignId)).toBeNull();
    expect(await listTpoCampaignRecipientStatuses(actor,campaignId)).toEqual({ready:false,rows:[]});
    expect(state.scope).toHaveBeenCalledWith(actor,collegeId);
    expect(state.db).not.toHaveBeenCalled();
  });

  it("TPO-campaign-draft-SVC-04 never enumerates campaigns from malformed IDs, even to a stale page",async()=>{
    expect(await getTpoCampaignDraft(actor,"../another-college")).toBeNull();
    await expect(listTpoCampaignRecipientStatuses(actor,"../another-college")).rejects.toThrow();
    expect(state.scope).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("TPO-campaign-dispatch-SVC-01 validates IDs and actor before provider, college or recipient access",async()=>{
    for(const raw of ["../other","not-a-uuid",null,{}]){
      await expect(dispatchTpoCampaign(actor,raw)).rejects.toThrow();
    }
    state.roleAllowed=false;
    await expect(dispatchTpoCampaign(actor,campaignId)).rejects.toThrow();
    state.roleAllowed=true;
    await expect(dispatchTpoCampaign({...actor,membership:null},campaignId)).rejects.toThrow();
    await expect(dispatchTpoCampaign({...actor,user:{...actor.user,platformStatus:"DISABLED"}},campaignId)).rejects.toThrow();
    expect(state.scope).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("TPO-campaign-dispatch-SVC-02 disabled provider never claims DRAFT or emits a receipt",async()=>{
    expect(await tpoCampaignDispatchReady()).toBe(false);
    await expect(dispatchTpoCampaign(actor,campaignId)).rejects.toMatchObject({code:"NOT_READY"});
    expect(state.scope).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
  });
});
