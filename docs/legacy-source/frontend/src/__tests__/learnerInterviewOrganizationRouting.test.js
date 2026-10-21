import Api from "@/api/ApiMethod";
import {
  getInterviewsForLearner,
  getUpcomingInterviewsForLearner,
} from "@/api/Services/interviewService";

jest.mock("@/api/ApiMethod", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe("learner interview organization routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses the backend-resolved organization path when the learner session has no organizationId", async () => {
    Api.get.mockResolvedValue({
      data: { status: "success", data: { content: [], totalPages: 1 } },
    });

    await getInterviewsForLearner(42, null, undefined, 0, 100);

    expect(Api.get).toHaveBeenCalledWith(
      "/api/v1/interviews/learner/42/organization/null",
      { params: { page: 0, size: 100 } }
    );
  });

  test("upcoming interviews also allow backend organization resolution", async () => {
    Api.get.mockResolvedValue({ data: { status: "success", data: [] } });

    await getUpcomingInterviewsForLearner(42, null);

    expect(Api.get).toHaveBeenCalledWith(
      "/api/v1/interviews/learner/42/upcoming/organization/null",
      undefined
    );
  });
});
