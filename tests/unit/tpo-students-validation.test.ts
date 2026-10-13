import { describe, expect, it } from "vitest";

import {
  tpoStudentsQuerySchema,
  tpoStudentRequestsQuerySchema,
} from "@/modules/placements/tpo-students-service";

const COLLEGE = "11111111-1111-4111-8111-111111111111";

const BRANCH = "22222222-2222-4222-8222-222222222222";

describe("TPO Students read filters", () => {
  it("defaults to first page of 25", () => {
    expect(
      tpoStudentsQuerySchema.parse({
        collegeId: COLLEGE,
      }),
    ).toMatchObject({
      collegeId: COLLEGE,
      page: 1,
      pageSize: 25,
    });
  });

  it("accepts known journey, branch and pagination filters", () => {
    const parsed = tpoStudentsQuerySchema.parse({
      collegeId: COLLEGE,
      journeyState: "READY_NOT_APPLYING",
      branchId: BRANCH,
      search: "  Kumar  ",
      page: "2",
      pageSize: "50",
    });

    expect(parsed).toMatchObject({
      branchId: BRANCH,
      search: "Kumar",
      journeyState: "READY_NOT_APPLYING",
      page: 2,
      pageSize: 50,
    });
  });

  it("rejects unauthorized schema shapes and invalid pages", () => {
    for (const raw of [
      { collegeId: "not-a-uuid" },
      { collegeId: COLLEGE, journeyState: "HIRED" },
      { collegeId: COLLEGE, branchId: "invalid" },
      { collegeId: COLLEGE, page: 0 },
      { collegeId: COLLEGE, pageSize: 101 },
      { collegeId: COLLEGE, page: "1.5" },
      { collegeId: COLLEGE, extra: "ignored?" },
    ]) {
      expect(
        tpoStudentsQuerySchema.safeParse(raw).success,
      ).toBe(false);
    }
  });
});

describe("Global TPO Student Requests read filters", () => {
  it("accepts only persisted request statuses", () => {
    expect(
      tpoStudentRequestsQuerySchema.parse({
        collegeId: COLLEGE,
        status: "PENDING",
        page: "3",
      }),
    ).toMatchObject({
      status: "PENDING",
      page: 3,
      pageSize: 25,
    });

    expect(
      tpoStudentRequestsQuerySchema.safeParse({
        collegeId: COLLEGE,
        status: "SENT_BACK",
      }).success,
    ).toBe(false);
  });

  it("does not accept arbitrary tenant or request filters", () => {
    expect(
      tpoStudentRequestsQuerySchema.safeParse({
        collegeId: COLLEGE,
        organizationId: BRANCH,
      }).success,
    ).toBe(false);
  });
});
