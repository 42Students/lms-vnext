import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
  db:vi.fn(),execute:vi.fn(),learner:vi.fn(),superAdmin:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/learner-participation-guard",()=>({
  requireLearnerPlacementAccess:state.learner,
}));
vi.mock("@/modules/admin-ui/super-admin-selected-college",()=>({
  requireSuperAdminSelectedCollege:state.superAdmin,
}));
import {CollegeInterviewLifecycleError} from "@/modules/placements/college-interview-lifecycle-service";
import {listRecruiterTodayRoundsNeedingSlots} from "@/modules/placements/hr-today-open-slots-service";
import {
  getOwnInterviewWithdrawalTargets,requestOwnInterviewWithdrawal,
} from "@/modules/placements/learner-interview-withdrawal-service";
import {learnerRoundConfirmationReady} from "@/modules/placements/learner-round-confirmation-readiness";
import {confirmOwnPlacementRound} from "@/modules/placements/learner-round-confirmation-service";
import {listSuperAdminBookedInterviews} from "@/modules/placements/super-admin-booked-interviews-service";
import {confirmTpoBulkRoundResults} from "@/modules/placements/tpo-bulk-round-result-service";
import {confirmTpoRoundResult} from "@/modules/placements/tpo-confirmed-round-result-service";
import {applyTpoWholeRound} from "@/modules/placements/tpo-round-apply-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const jobId="22222222-2222-4222-8222-222222222222";
const roundId="33333333-3333-4333-8333-333333333333";
const applicationId="44444444-4444-4444-8444-444444444444";
const actor={
  user:{id:"learner",identityUid:"learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"m1",collegeId,organizationId:"org",status:"ACTIVE",roles:["LEARNER"]},
} as unknown as RequestContext;
const noMember={...actor,membership:null} as RequestContext;

beforeEach(()=>{
  vi.clearAllMocks();
  state.db.mockReturnValue({execute:state.execute});
  state.learner.mockRejectedValue(new Error("LEARNER_ROLE_REVOKED"));
  state.superAdmin.mockImplementation(()=>{throw new Error("SUPER_ADMIN_SELECTION_REQUIRED");});
});
describe("chat-2 uncovered interview and round service direct boundaries",()=>{
  it("COL-interview-terminal-01 exposes a typed stale/storage error without swallowing the cause",()=>{
    for(const code of ["INTERVIEW_STORAGE_PENDING","INTERVIEW_STALE"] as const){
      const error=new CollegeInterviewLifecycleError(code);
      expect(error.code).toBe(code);
      expect(error.message).toBe(code);
      expect(error.name).toBe("CollegeInterviewLifecycleError");
    }
  });

  it("HR-today-slots-01 does not inspect unscoped or empty authorized job lists",async()=>{
    expect(await listRecruiterTodayRoundsNeedingSlots(collegeId,[],new Date())).toEqual([]);
    expect(state.db).not.toHaveBeenCalled();
  });

  it("LNR-withdrawals-01 rejects a revoked learner membership before reading another learner's offers or requests",async()=>{
    await expect(getOwnInterviewWithdrawalTargets(actor)).rejects.toThrow("LEARNER_ROLE_REVOKED");
    expect(state.db).not.toHaveBeenCalled();
  });

  it("LNR-withdrawals-02 rejects malformed or forged application version before identity lookup",async()=>{
    for(const input of [
      {applicationId:"../foreign",roundId,expectedUpdatedAt:"2026-10-20T04:30:00Z",reason:"Changed",confirmed:true},
      {applicationId,roundId,reason:"Changed",expectedUpdatedAt:"bad-date",confirmed:true},
      {applicationId,roundId,reason:"Changed",expectedUpdatedAt:"2026-10-20T04:30:00Z",confirmed:true,collegeId},
      {applicationId,roundId,reason:"Changed",expectedUpdatedAt:"2026-10-20T04:30:00Z",confirmed:false},
    ])await expect(requestOwnInterviewWithdrawal(actor,input)).rejects.toThrow();
    expect(state.learner).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("LNR-round-confirm-01 reports readiness only for a verified registered column",async()=>{
    state.execute.mockResolvedValueOnce({rows:[{ready:false}]});
    expect(await learnerRoundConfirmationReady()).toBe(false);
    state.execute.mockResolvedValueOnce({rows:[{ready:true}]});
    expect(await learnerRoundConfirmationReady()).toBe(true);
    state.execute.mockResolvedValueOnce({rows:[]});
    expect(await learnerRoundConfirmationReady()).toBe(false);
    expect(state.db).toHaveBeenCalledTimes(3);
  });

  it("LNR-round-confirm-02 denies forged tenant selector, nonexistent ID shape and missing explicit opt-in before DB",async()=>{
    for(const input of [
      {applicationId,roundId,confirmed:false},
      {applicationId,roundId,confirmed:true,collegeId},
      {applicationId:"not-uuid",roundId,confirmed:true},
      {applicationId,roundId:"../other",confirmed:true},
    ])await expect(confirmOwnPlacementRound(actor,input)).rejects.toThrow();
    expect(state.learner).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
    await expect(confirmOwnPlacementRound(actor,{
      applicationId,roundId,confirmed:true,
    })).rejects.toThrow("LEARNER_ROLE_REVOKED");
    expect(state.db).not.toHaveBeenCalled();
  });

  it("SA-booked-interviews-01 requires a selected authorized college before resolving any student booking",async()=>{
    await expect(listSuperAdminBookedInterviews(actor,"2099-04-01","2099-05-01"))
      .rejects.toThrow("SUPER_ADMIN_SELECTION_REQUIRED");
    expect(state.superAdmin).toHaveBeenCalledWith(actor,"placements.read");
    expect(state.db).not.toHaveBeenCalled();
  });

  it("SA-booked-interviews-02 safely returns empty on an invalid date window after successful selection",async()=>{
    state.superAdmin.mockReturnValueOnce({collegeId});
    expect(await listSuperAdminBookedInterviews(actor,"invalid","2099-05-01")).toEqual({
      events:[],truncated:false,
    });
    expect(state.db).not.toHaveBeenCalled();
  });

  it("TPO-round-results-01 rejects unauthenticated or wrong-role batch staging before reading any applicant result",async()=>{
    await expect(confirmTpoBulkRoundResults(noMember,roundId,{})).rejects.toThrow();
    await expect(confirmTpoRoundResult(noMember,roundId,{})).rejects.toThrow();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("TPO-round-results-02 refuses application result write paths with no selected identity even to TPO actors",async()=>{
    await expect(confirmTpoBulkRoundResults(noMember,"../other",{})).rejects.toThrow();
    await expect(confirmTpoRoundResult(noMember,"../other",{})).rejects.toThrow();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("TPO-round-apply-01 rejects missing preview confirmation or tenant fields before any DB lookup",async()=>{
    for(const body of [
      {},{confirmed:false,expectedPreviewToken:"abc"},
      {confirmed:true,expectedPreviewToken:"abc",collegeId},
    ])await expect(applyTpoWholeRound(noMember,jobId,roundId,body)).rejects.toThrow();
    expect(state.db).not.toHaveBeenCalled();
  });
});
