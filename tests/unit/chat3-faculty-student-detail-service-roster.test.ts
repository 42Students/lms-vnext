import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const stubs = vi.hoisted(() => ({
  roster: vi.fn(),
  workspace: vi.fn(),
  detail: vi.fn(),
}));
vi.mock("@/modules/attendance/faculty-service", () => ({
  getFacultyDeliveryRoster: stubs.roster,
  getFacultyAttendanceWorkspace: stubs.workspace,
}));
vi.mock("@/modules/attendance/faculty-learner-attendance-detail", () => ({
  facultyLearnerAttendanceDetail: stubs.detail,
}));
import { getFacultyStudentDetail } from "@/modules/courses/faculty-student-detail-service";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const learner = "22222222-2222-4222-8222-222222222222";
const foreign = "33333333-3333-4333-8333-333333333333";
const scheduleId = "44444444-4444-4444-8444-444444444444";
const start = new Date("2099-01-01T10:00:00.000Z");
const end = new Date("2099-01-01T11:00:00.000Z");

function actor(): RequestContext {
  return {
    user: {
      id: "faculty",
      identityUid: "faculty",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: "faculty-membership",
      collegeId: "college-a",
      organizationId: "org-a",
      status: "ACTIVE",
      roles: ["FACULTY"],
    },
  };
}
const request = { deliveryId, membershipId: learner };
const owned = { membershipId: learner, displayName: "Student A", rollNumber: "1" };
const other = { membershipId: foreign, displayName: "Student B", rollNumber: "2" };

beforeEach(() => {
  vi.resetAllMocks();
  stubs.roster.mockResolvedValue({
    delivery: {
      deliveryId,
      courseName: "Physics",
      sectionName: "A",
      academicPeriodName: "Semester 1",
    },
    roster: [owned, other],
  });
  stubs.workspace.mockResolvedValue({
    roster: [owned, other],
    sessions: [{
      id: scheduleId,
      title: "Lecture",
      startsAt: start,
      endsAt: end,
      attendanceStatus: "MARKED",
    }],
    records: [
      {
        scheduleEventId: scheduleId,
        membershipId: learner,
        status: "ABSENT",
        markedAt: start,
        note: "Learner absent",
      },
      {
        scheduleEventId: scheduleId,
        membershipId: foreign,
        status: "ABSENT",
        markedAt: start,
        note: "Another student's private note",
      },
    ],
  });
  stubs.detail.mockResolvedValue(undefined);
  stubs.detail.mockReturnValue({
    present: 0,
    absent: 1,
    unmarked: 0,
    upcoming: 0,
    attendedPercent: 0,
    rows: [{ id: scheduleId, code: "A" }],
  });
});

describe("FAC-STUDENT-DETAIL-SERVICE-01 exact live roster and attendance scope", () => {
  it("passes only requested enrolled student's attendance records and returns bounded session results", async () => {
    const result = await getFacultyStudentDetail(actor(), request);
    expect(stubs.roster).toHaveBeenCalledWith(expect.anything(), deliveryId);
    expect(stubs.workspace).toHaveBeenCalledWith(expect.anything(), deliveryId);
    expect(stubs.detail).toHaveBeenCalledOnce();
    const call = stubs.detail.mock.calls[0]!;
    expect(call[0]).toBe(learner);
    expect(call[1]).toMatchObject([{ id: scheduleId, title: "Lecture" }]);
    expect(call[2]).toMatchObject([{ membershipId: learner, note: "Learner absent" }]);
    expect(JSON.stringify(call[2])).not.toContain("Another student's private note");
    expect(result.student.membershipId).toBe(learner);
    expect(result.summary).toMatchObject({
      present: 0, absent: 1, recorded: 1, percent: 0,
    });
    expect(result.course.deliveryId).toBe(deliveryId);
  });

  it("denies foreign or departed learners before attendance report reads", async () => {
    stubs.roster.mockResolvedValueOnce({
      delivery: { deliveryId },
      roster: [other],
    });
    await expect(getFacultyStudentDetail(actor(), request))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    expect(stubs.workspace).not.toHaveBeenCalled();

    stubs.workspace.mockResolvedValueOnce({
      roster: [other],
      sessions: [],
      records: [],
    });
    await expect(getFacultyStudentDetail(actor(), request))
      .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    expect(stubs.detail).not.toHaveBeenCalled();
  });

  it("denies Mentor, Learner, College Admin and disabled Faculty before accessing roster", async () => {
    const base = actor();
    for (const context of [
      { ...base, membership: { ...base.membership!, roles: ["MENTOR"] as const } },
      { ...base, membership: { ...base.membership!, roles: ["LEARNER"] as const } },
      { ...base, membership: { ...base.membership!, roles: ["COLLEGE_ADMIN"] as const } },
      { ...base, membership: { ...base.membership!, status: "SUSPENDED" as const } },
      { ...base, user: { ...base.user, platformStatus: "DISABLED" as const } },
      { ...base, membership: null },
    ]) {
      await expect(getFacultyStudentDetail(context, request))
        .rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    }
    expect(stubs.roster).not.toHaveBeenCalled();
  });

  it("rejects forged tenant selectors and invalid IDs before looking up any student", async () => {
    for (const invalid of [
      { deliveryId: "not-uuid", membershipId: learner },
      { deliveryId, membershipId: "not-uuid" },
      { ...request, collegeId: "other-college" },
    ]) {
      await expect(getFacultyStudentDetail(actor(), invalid)).rejects.toThrow();
    }
    expect(stubs.roster).not.toHaveBeenCalled();
  });
});
