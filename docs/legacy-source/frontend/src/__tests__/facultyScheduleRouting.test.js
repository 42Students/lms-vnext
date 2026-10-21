import Api from "@/api/ApiMethod";
import { scheduleClass } from "@/api/Services/attendanceServices";

jest.mock("@/api/ApiMethod", () => ({ __esModule: true, default: { post: jest.fn() } }));

test("faculty scheduling posts the exact course and class to its assignment-scoped endpoint", async () => {
  const request = {
    faculty_id: 31,
    class_id: 9,
    course_slug: "java-programming",
    start_time: "2026-10-01 10:00:00",
    end_time: "2026-10-01 11:00:00",
  };
  Api.post.mockResolvedValue({ data: { status: "OK", data: { id: 77 } } });
  await expect(scheduleClass(request)).resolves.toEqual({ status: "OK", data: { id: 77 } });
  expect(Api.post).toHaveBeenCalledTimes(1);
  expect(Api.post).toHaveBeenCalledWith("/api/v1/faculty/schedules", request);
});

test("faculty scheduling propagates a 403 rather than reporting success", async () => {
  const denied = { response: { status: 403, data: { message: "Not assigned to this class" } } };
  Api.post.mockRejectedValueOnce(denied);
  await expect(scheduleClass({ faculty_id: 31, class_id: 88 })).rejects.toBe(denied);
});
