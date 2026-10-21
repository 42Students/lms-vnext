import Api from "@/api/ApiMethod";
import {
  bulkUpdateAdminApplicationStatus,
  updateAdminApplicationStatus,
} from "@/api/Services/AdminService";

jest.mock("@/api/ApiMethod", () => ({
  __esModule: true,
  default: { put: jest.fn(), post: jest.fn() },
}));

describe("assessment URL persistence policy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Api.put.mockResolvedValue({ data: { status: "success" } });
    Api.post.mockResolvedValue({ data: { status: "success" } });
  });

  test("single application sends application-only policy when save-to-job is unchecked", async () => {
    await updateAdminApplicationStatus(
      10, 55, "ASSESSMENT", 7, "https://candidate.example/one-off", undefined, false
    );

    expect(Api.put).toHaveBeenCalledWith(
      "/api/v1/admin/jobs/10/applications/55/status?collegeId=7",
      {
        applicationStatus: "ASSESSMENT",
        assessmentUrl: "https://candidate.example/one-off",
        saveAssessmentUrlToJob: false,
      }
    );
  });

  test("bulk assessment preserves the same explicit persistence policy", async () => {
    await bulkUpdateAdminApplicationStatus(
      10, 7, [55, 56], "ASSESSMENT", "https://batch.example/link", undefined, false
    );

    expect(Api.post).toHaveBeenCalledWith(
      "/api/v1/admin/jobs/10/applications/bulk-status?collegeId=7",
      {
        applicationIds: [55, 56],
        newStatus: "ASSESSMENT",
        assessmentUrl: "https://batch.example/link",
        saveAssessmentUrlToJob: false,
      }
    );
  });

  test("legacy callers default to saving assessment links to the job", async () => {
    await updateAdminApplicationStatus(10, 55, "ASSESSMENT", 7, "https://default.example/link");

    expect(Api.put.mock.calls[0][1].saveAssessmentUrlToJob).toBe(true);
  });
});
