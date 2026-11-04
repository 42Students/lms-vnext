import { beforeEach, describe, expect, it, vi } from "vitest";
import { canOwnLearnerReceiveClassNotice } from "@/modules/activity/learner-notification-membership-service";
import { requireStaffNotificationAudience } from "@/modules/activity/notification-service";
import {
  canSubscribeToClassNotificationStream,
  notificationStreamScopeUnchanged,
} from "@/modules/activity/notification-stream-authorization";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/modules/activity/learner-notification-membership-service", () => ({
  canOwnLearnerReceiveClassNotice: vi.fn(),
}));
vi.mock("@/modules/activity/notification-service", () => ({
  requireStaffNotificationAudience: vi.fn(),
}));

const collegeA = "11111111-1111-4111-8111-111111111111";
const collegeB = "22222222-2222-4222-8222-222222222222";
const classId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";
const memberId = "55555555-5555-4555-8555-555555555555";
const orgId = "66666666-6666-4666-8666-666666666666";

function actor(role: "LEARNER" | "FACULTY" | "TPO" | "COLLEGE_ADMIN" = "LEARNER"): RequestContext {
  return {
    user: { id:userId, identityUid:"firebase-fixture-user",
      platformStatus:"ACTIVE", systemRoles:[] },
    membership: { id:memberId, collegeId:collegeA, organizationId:orgId,
      status:"ACTIVE", roles:[role] },
    adminScope:null, recruiter:null,
  };
}
beforeEach(() => vi.clearAllMocks());

describe("notification stream selected-authority invariants", () => {
  it("retains identical live actor authority without demanding new privilege", () => {
    expect(notificationStreamScopeUnchanged(actor(), actor())).toBe(true);
  });
  it("denies fallback into another role after revocation", () => {
    expect(notificationStreamScopeUnchanged(actor("LEARNER"), actor("COLLEGE_ADMIN"))).toBe(false);
  });
  it("denies a tenant switch even if identity and role are unchanged", () => {
    const switched = actor();
    switched.membership = { ...switched.membership!, collegeId:collegeB };
    expect(notificationStreamScopeUnchanged(actor(), switched)).toBe(false);
  });
  it("denies disabled user, missing membership and multirole blended context", () => {
    const disabled = actor();
    disabled.user = { ...disabled.user, platformStatus:"DISABLED" };
    expect(notificationStreamScopeUnchanged(actor(), disabled)).toBe(false);
    const missing = actor();
    missing.membership = null;
    expect(notificationStreamScopeUnchanged(actor(), missing)).toBe(false);
    const blended = actor();
    blended.membership = { ...blended.membership!, roles:["LEARNER","COLLEGE_ADMIN"] };
    expect(notificationStreamScopeUnchanged(actor(), blended)).toBe(false);
  });
  it("closes a platform stream when system authority changes", () => {
    const platform: RequestContext = { ...actor(),
      membership:null, user:{...actor().user,systemRoles:["SUPER_ADMIN"]} };
    const revoked = { ...platform,user:{...platform.user,systemRoles:[]} };
    expect(notificationStreamScopeUnchanged(platform,revoked)).toBe(false);
  });
  it("closes a recruiter stream on grant revocation", () => {
    const recruiter: RequestContext = {...actor(),membership:null,
      recruiter:{userId,companyId:collegeA,companyName:"Fixture",title:null,status:"ACTIVE",
        grants:[{id:memberId,organizationId:orgId,collegeId:collegeA,
          collegeName:"A",companyRelationshipId:classId}]}};
    const revoked = {...recruiter,recruiter:{...recruiter.recruiter!,grants:[]}};
    expect(notificationStreamScopeUnchanged(recruiter,revoked)).toBe(false);
  });
});

describe("notification class subscriptions cannot infer unassigned classes", () => {
  it("requires a live enrollment for learners", async () => {
    vi.mocked(canOwnLearnerReceiveClassNotice).mockResolvedValue(false);
    expect(await canSubscribeToClassNotificationStream(actor("LEARNER"),classId)).toBe(false);
    vi.mocked(canOwnLearnerReceiveClassNotice).mockResolvedValue(true);
    expect(await canSubscribeToClassNotificationStream(actor("LEARNER"),classId)).toBe(true);
    expect(requireStaffNotificationAudience).not.toHaveBeenCalled();
  });
  it("denies TPO and unselected roles before querying class details", async () => {
    expect(await canSubscribeToClassNotificationStream(actor("TPO"),classId)).toBe(false);
    expect(requireStaffNotificationAudience).not.toHaveBeenCalled();
    expect(canOwnLearnerReceiveClassNotice).not.toHaveBeenCalled();
  });
  it("denies unassigned faculty even within the same college", async () => {
    vi.mocked(requireStaffNotificationAudience).mockRejectedValue(new Error("NOTIFICATION_SCOPE_MISMATCH"));
    expect(await canSubscribeToClassNotificationStream(actor("FACULTY"),classId)).toBe(false);
  });
  it("permits assigned faculty but refuses a foreign target college", async () => {
    vi.mocked(requireStaffNotificationAudience).mockResolvedValue({
      draft:{title:"Scoped notification stream",htmlContent:"Authorization check only",classId},
      audience:{collegeId:collegeA,organizationId:orgId,classId,courseId:null},
    });
    expect(await canSubscribeToClassNotificationStream(actor("FACULTY"),classId)).toBe(true);
    vi.mocked(requireStaffNotificationAudience).mockResolvedValue({
      draft:{title:"Scoped notification stream",htmlContent:"Authorization check only",classId},
      audience:{collegeId:collegeB,organizationId:orgId,classId,courseId:null},
    });
    expect(await canSubscribeToClassNotificationStream(actor("FACULTY"),classId)).toBe(false);
  });
  it("requires an explicit college scope for Super Admin subscriptions", async () => {
    const admin: RequestContext = {...actor(),membership:null,
      user:{...actor().user,systemRoles:["SUPER_ADMIN"]},
      adminScope:{collegeId:collegeA,organizationId:orgId}};
    vi.mocked(requireStaffNotificationAudience).mockResolvedValue({
      draft:{title:"Scoped notification stream",htmlContent:"Authorization check only",classId},
      audience:{collegeId:collegeA,organizationId:orgId,classId,courseId:null},
    });
    expect(await canSubscribeToClassNotificationStream(admin,classId)).toBe(true);
    expect(await canSubscribeToClassNotificationStream({...admin,adminScope:null},classId)).toBe(false);
  });
});
