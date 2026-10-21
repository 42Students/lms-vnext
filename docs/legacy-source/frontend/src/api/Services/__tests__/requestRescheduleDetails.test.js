/**
 * Student V1 §7: requestReschedule now actually sends the learner's reason/note/preferred
 * windows to the placement cell, instead of posting no body at all.
 */
import Api from "@/api/ApiMethod";
import { requestReschedule } from "@/api/Services/interviewService";

jest.mock("@/api/ApiMethod", () => ({ post: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  Api.post.mockResolvedValue({ data: { status: "success" } });
});

test("posts reason/note/windows to the request-reschedule endpoint", async () => {
  await requestReschedule(501, 42, 7, { reason: "Exam clash", note: "Mid-sem that morning", windows: [{ day: "Thursday", band: "Afternoon" }] });
  expect(Api.post).toHaveBeenCalledWith(
    "/api/v1/interviews/501/request-reschedule/learner/42/organization/7",
    { reason: "Exam clash", note: "Mid-sem that morning", windows: [{ day: "Thursday", band: "Afternoon" }] }
  );
});

test("posts no body when no details are given", async () => {
  await requestReschedule(501, 42, 7);
  expect(Api.post).toHaveBeenCalledWith("/api/v1/interviews/501/request-reschedule/learner/42/organization/7", undefined);
});
