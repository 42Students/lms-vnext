import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
const mocks=vi.hoisted(()=>({
 actor:vi.fn(),policy:vi.fn(),communication:vi.fn(),db:vi.fn(),
}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:mocks.actor,
}));
vi.mock("@/modules/placements/tpo-configuration-read-service",()=>({
 getTpoPrepReadiness:mocks.policy,
}));
vi.mock("@/modules/placements/tpo-communication-settings-service",()=>({
 getTpoCommunicationSettings:mocks.communication,
}));
vi.mock("@/db/client",()=>({getDb:mocks.db}));
import {readTpoLearnerPrepOutcomes} from "@/modules/placements/tpo-prep-readiness-derived-service";
import type {RequestContext} from "@/modules/identity/context";

const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const context={} as RequestContext;
beforeEach(()=>{
 for(const mock of Object.values(mocks))mock.mockReset();
 mocks.actor.mockResolvedValue(college);
});

describe("TPO-settings-audit-PREP-SCOPE-01 no cross-tenant readiness shortcut",()=>{
 it("denies a forged college even for an empty batch, without reading policy or progress",async()=>{
  await expect(readTpoLearnerPrepOutcomes(context,other,[]))
   .rejects.toMatchObject({name:"AuthorizationError"});
  expect(mocks.actor).toHaveBeenCalledWith(context);
  expect(mocks.policy).not.toHaveBeenCalled();
  expect(mocks.communication).not.toHaveBeenCalled();
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it("denies suspended or revoked TPO accounts before returning a seemingly successful empty roster",async()=>{
  mocks.actor.mockRejectedValueOnce(Error("revoked"));
  await expect(readTpoLearnerPrepOutcomes(context,college,[])).rejects.toThrow("revoked");
  expect(mocks.policy).not.toHaveBeenCalled();
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it("allows an active authorized college's genuinely empty roster without fetching student progress",async()=>{
  expect(await readTpoLearnerPrepOutcomes(context,college,[]))
   .toEqual({available:true,outcomes:new Map()});
  expect(mocks.actor).toHaveBeenCalledTimes(1);
  expect(mocks.policy).not.toHaveBeenCalled();
  expect(mocks.communication).not.toHaveBeenCalled();
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it("checks scope before configuration reads for nonempty rosters",async()=>{
  await expect(readTpoLearnerPrepOutcomes(context,other,[{
   membershipId:other,cohortId:other,
  }])).rejects.toMatchObject({name:"AuthorizationError"});
  expect(mocks.policy).not.toHaveBeenCalled();
  const source=readFileSync("src/modules/placements/tpo-prep-readiness-derived-service.ts","utf8");
  expect(source.indexOf("requireTpoBatchActor(context)"))
   .toBeLessThan(source.indexOf("if(!learners.length)"));
  expect(source).toContain("if(scopedCollegeId!==collegeId)");
 });
});
