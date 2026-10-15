import { describe, expect, it } from "vitest";
import {
  planWithdrawPendingVerification, VerificationStateError, type VerificationRecord,
} from "@/modules/profile-verification/domain";

const date = new Date("2026-10-16T08:00:00Z");
const actor = {userId:"learner",kind:"LEARNER" as const,displayName:null};
const record: VerificationRecord = {
  learnerMembershipId:"member",section:"EDUCATION",status:"UPDATE_PENDING",
  submittedSnapshot:{education:[{grade:"90"}]},verifiedSnapshot:{education:[{grade:"70"}]},
  submittedAt:date,verifiedAt:date,decidedAt:date,
  decidedByUserId:"staff",decidedByName:"Staff",note:null,version:4,
};

describe("UPDATE_PENDING withdrawal, pending registered event constraint", () => {
  it("restores prior verified snapshot without publishing new grades", () => {
    const result = planWithdrawPendingVerification({existing:record,expectedVersion:4,actor,now:date});
    expect(result.record.status).toBe("VERIFIED");
    expect(result.record.submittedSnapshot).toEqual(record.verifiedSnapshot);
    expect(result.record.verifiedSnapshot).toEqual(record.verifiedSnapshot);
    expect(result.record.version).toBe(5);
    expect(result.event.action).toBe("WITHDRAWN");
    expect(result.event.actorKind).toBe("LEARNER");
  });
  it("rejects wrong role, stale version and nonpending statuses", () => {
    expect(()=>planWithdrawPendingVerification({existing:record,expectedVersion:3,actor,now:date}))
      .toThrowError(VerificationStateError);
    expect(()=>planWithdrawPendingVerification({existing:record,expectedVersion:4,
      actor:{...actor,kind:"TPO"},now:date})).toThrowError(VerificationStateError);
    expect(()=>planWithdrawPendingVerification({existing:{...record,status:"VERIFIED"},
      expectedVersion:4,actor,now:date})).toThrowError(VerificationStateError);
  });
  it("never removes a learner's sole approved baseline", () => {
    expect(()=>planWithdrawPendingVerification({existing:{...record,verifiedSnapshot:null},
      expectedVersion:4,actor,now:date})).toThrowError(VerificationStateError);
  });
});
