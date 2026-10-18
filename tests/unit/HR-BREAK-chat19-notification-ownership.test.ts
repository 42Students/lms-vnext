import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {ownsHrNotificationActor} from "@/modules/placements/hr-notification-read-model";

const mocks=vi.hoisted(()=>({jobs:vi.fn(),db:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.db}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:mocks.jobs,
}));
import {markHrNotificationRead} from "@/modules/placements/hr-notification-read-service";

const id="11111111-1111-4111-8111-111111111111";
const actor:RequestContext={
 user:{id:"signed-in",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"signed-in",companyId:"employer",companyName:"Employer",
  title:null,status:"ACTIVE",grants:[]},
};
const token={expectedCreatedAt:"2026-10-18T10:00:00.000Z"};

describe("HR-BREAK-NOTIFICATION-OWNER-06: no cross-user recruiter notification mutation",()=>{
 beforeEach(()=>vi.clearAllMocks());
 it("allows exact active user/recruiter equality but denies mismatched or inactive principals",()=>{
  expect(ownsHrNotificationActor(actor)).toBe(true);
  expect(ownsHrNotificationActor({...actor,recruiter:{...actor.recruiter!,userId:"other"}})).toBe(false);
  expect(ownsHrNotificationActor({...actor,recruiter:null})).toBe(false);
  expect(ownsHrNotificationActor({...actor,user:{...actor.user,platformStatus:"DISABLED"}})).toBe(false);
  expect(ownsHrNotificationActor({...actor,recruiter:{...actor.recruiter!,status:"DISABLED"}})).toBe(false);
 });
 it.each([
  ["cross-user grant",{...actor,recruiter:{...actor.recruiter!,userId:"somebody-else"}}],
  ["disabled principal",{...actor,user:{...actor.user,platformStatus:"DISABLED" as const}}],
  ["missing recruiter",{...actor,recruiter:null}],
 ])("denies %s before fetching job inventory or opening a write transaction",async(_name,context)=>{
  await expect(markHrNotificationRead(context,id,token)).rejects.toThrow();
  expect(mocks.jobs).not.toHaveBeenCalled();
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it("valid actor passes identity guard and proceeds to independently scoped job lookup",async()=>{
  mocks.jobs.mockResolvedValue([]);
  await expect(markHrNotificationRead(actor,id,token)).rejects.toThrow();
  expect(mocks.jobs).toHaveBeenCalledWith(actor);
  expect(mocks.db).not.toHaveBeenCalled();
 });
});
