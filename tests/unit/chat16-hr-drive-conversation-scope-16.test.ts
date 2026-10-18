import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { getRecruiterPlacementWorkspace } from "@/modules/placements/recruiter-workspace-service";
import { listMessageThreads } from "@/modules/placements/tpo-messaging-service";
import { getRecruiterDriveConversations } from "@/modules/placements/hr-drive-conversation-service";
import { recruiterDriveThreads } from "@/modules/placements/hr-drive-conversation-model";
import { recruiterMessageTpoPreview } from "@/modules/placements/recruiter-message-tpo-notification-model";

vi.mock("@/modules/placements/recruiter-workspace-service", () => ({
  getRecruiterPlacementWorkspace: vi.fn(),
}));
vi.mock("@/modules/placements/tpo-messaging-service", () => ({
  listMessageThreads: vi.fn(),
}));

const collegeId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const otherJob = "33333333-3333-4333-8333-333333333333";
const recruiterId = "44444444-4444-4444-8444-444444444444";
const context: RequestContext = {
  user: { id: recruiterId, identityUid: "hr-user", platformStatus: "ACTIVE", systemRoles: [] },
  membership: null,
};
const workspace = {
  college: { id: collegeId },
  job: { id: jobId },
} as unknown as Awaited<ReturnType<typeof getRecruiterPlacementWorkspace>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRecruiterPlacementWorkspace).mockResolvedValue(workspace);
  vi.mocked(listMessageThreads).mockResolvedValue([]);
});

describe("chat-16 recruiter drive conversation authorization and notice preview", () => {
  it("HR-DRIVE-MESSAGES-16 rejects a malformed job ID before looking up a recruiter workspace", async () => {
    await expect(getRecruiterDriveConversations(context, "../admin")).rejects.toThrow();
    expect(getRecruiterPlacementWorkspace).not.toHaveBeenCalled();
    expect(listMessageThreads).not.toHaveBeenCalled();
  });

  it("HR-DRIVE-MESSAGES-17 rejects revoked workspace grants before reading any messages", async () => {
    vi.mocked(getRecruiterPlacementWorkspace).mockRejectedValue(
      new Error("PLACEMENT_JOB_NOT_FOUND"),
    );
    await expect(getRecruiterDriveConversations(context, jobId)).rejects.toThrow();
    expect(listMessageThreads).not.toHaveBeenCalled();
    expect(getRecruiterPlacementWorkspace).toHaveBeenCalledWith(context, jobId);
  });

  it("HR-DRIVE-MESSAGES-18 drops other colleges, other jobs and other recruiters even after an authorized workspace lookup", async () => {
    const rows = [
      { id: "one", collegeId, jobId, recruiterUserId: recruiterId },
      { id: "other-job", collegeId, jobId: otherJob, recruiterUserId: recruiterId },
      { id: "other-user", collegeId, jobId, recruiterUserId: "other" },
      { id: "other-college", collegeId: otherJob, jobId, recruiterUserId: recruiterId },
      { id: "general", collegeId, jobId: null, recruiterUserId: recruiterId },
    ] as unknown as Awaited<ReturnType<typeof listMessageThreads>>;
    vi.mocked(listMessageThreads).mockResolvedValue(rows);
    const result = await getRecruiterDriveConversations(context, jobId);
    expect(result.workspace).toBe(workspace);
    expect(result.threads.map(thread => thread.id)).toEqual(["one"]);
    expect(listMessageThreads).toHaveBeenCalledExactlyOnceWith(context, collegeId);
  });

  it("HR-DRIVE-MESSAGES-19 preserves caller-owned input arrays while filtering direct threads", () => {
    const rows = [
      { jobId, recruiterUserId: recruiterId },
      { jobId: null, recruiterUserId: recruiterId },
    ];
    expect(recruiterDriveThreads(rows, jobId, recruiterId)).toEqual([rows[0]]);
    expect(rows).toHaveLength(2);
  });

  it("REC-calendar-messages-profile-17 notice preview removes control characters and remains single-line", () => {
    expect(recruiterMessageTpoPreview(" Hello\r\nWorld\tfrom\u0000recruiter ")).toBe(
      "Hello World from recruiter",
    );
    expect(Array.from(recruiterMessageTpoPreview("😀".repeat(121)))).toHaveLength(121);
    expect(recruiterMessageTpoPreview("😀".repeat(121)).endsWith("…")).toBe(true);
  });
});
