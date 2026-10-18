import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";

const state = vi.hoisted(() => ({
  delivery: vi.fn(),
  grant: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@/modules/courses/scope", () => ({
  loadCourseSectionDeliveryScope: state.delivery,
}));
vi.mock("@/modules/courses/learning-access", () => ({
  requireDeliveryContentMutation: state.grant,
}));
vi.mock("@/modules/courses/discussion-service", () => ({
  createCourseDiscussionMessage: state.create,
}));
import { postFacultyDiscussionReply } from "@/modules/courses/faculty-discussion-reply-service";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";
const collegeId = "33333333-3333-4333-8333-333333333333";
const organizationId = "44444444-4444-4444-8444-444444444444";
const valid = {
  messageText: "Needs a clearer example.",
  replyToMessageId: messageId,
  expectedParentUpdatedAt: "2099-01-01T00:00:00.000Z",
  confirmed: true,
};

function context(role: MembershipRole = "FACULTY"): RequestContext {
  return {
    user: {
      id: "faculty-user",
      identityUid: "faculty-identity",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: "membership-id", collegeId, organizationId, status: "ACTIVE", roles: [role],
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  state.delivery.mockResolvedValue({ id: deliveryId, collegeId, organizationId });
  state.grant.mockResolvedValue("FACULTY");
  state.create.mockResolvedValue({ id: "saved-message" });
});

describe("FAC-DISCUSSION-SERVICE-01 Faculty reply scope and race protection", () => {
  it("rejects forged or invalid message, delivery and timestamp values before fetching a teaching grant", async () => {
    const invalid = [
      { ...valid, messageText: " " },
      { ...valid, messageText: "x".repeat(3901) },
      { ...valid, confirmed: false },
      { ...valid, replyToMessageId: "not-an-id" },
      { ...valid, expectedParentUpdatedAt: "yesterday" },
      { ...valid, collegeId: "spoofed" },
    ];
    for (const payload of invalid) {
      await expect(postFacultyDiscussionReply(context(), deliveryId, payload)).rejects.toThrow();
    }
    await expect(postFacultyDiscussionReply(context(), "invalid", valid)).rejects.toThrow();
    expect(state.delivery).not.toHaveBeenCalled();
    expect(state.grant).not.toHaveBeenCalled();
    expect(state.create).not.toHaveBeenCalled();
  });

  it("forbids Mentor, Learner, College Admin and disabled/suspended Faculty before any scoped lookup", async () => {
    const blocked: RequestContext[] = [
      context("MENTOR"),
      context("LEARNER"),
      context("COLLEGE_ADMIN"),
      { ...context(), user: { ...context().user, platformStatus: "DISABLED" } },
      { ...context(), membership: { ...context().membership!, status: "SUSPENDED" } },
    ];
    for (const actor of blocked) {
      await expect(postFacultyDiscussionReply(actor, deliveryId, valid))
        .rejects.toMatchObject({ code: "DISCUSSION_POST_ACCESS_DENIED" });
    }
    expect(state.delivery).not.toHaveBeenCalled();
    expect(state.create).not.toHaveBeenCalled();
  });

  it("rejects a foreign organization or college before running a teaching-grant mutation", async () => {
    state.delivery.mockResolvedValue({ id: deliveryId,
      collegeId: "55555555-5555-4555-8555-555555555555",
      organizationId: "66666666-6666-4666-8666-666666666666",
    });
    await expect(postFacultyDiscussionReply(context(), deliveryId, valid))
      .rejects.toMatchObject({ code: "DISCUSSION_POST_ACCESS_DENIED" });
    expect(state.grant).not.toHaveBeenCalled();
    expect(state.create).not.toHaveBeenCalled();
  });

  it("fails closed if the persisted teaching grant was revoked since the page loaded", async () => {
    state.grant.mockRejectedValueOnce(new Error("revoked"));
    await expect(postFacultyDiscussionReply(context(), deliveryId, valid)).rejects.toThrow("revoked");
    state.grant.mockResolvedValueOnce("ADMIN");
    await expect(postFacultyDiscussionReply(context(), deliveryId, valid))
      .rejects.toMatchObject({ code: "DISCUSSION_POST_ACCESS_DENIED" });
    expect(state.create).not.toHaveBeenCalled();
  });

  it("posts only the parsed confirmed reply using the original authenticated Faculty context", async () => {
    const actor = context();
    await expect(postFacultyDiscussionReply(actor, deliveryId, valid))
      .resolves.toEqual({ id: "saved-message" });
    expect(state.grant).toHaveBeenCalledWith(actor, deliveryId);
    expect(state.create).toHaveBeenCalledOnce();
    expect(state.create).toHaveBeenCalledWith(actor, deliveryId, valid);
  });
});
