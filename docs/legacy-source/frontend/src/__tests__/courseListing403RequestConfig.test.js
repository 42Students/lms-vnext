import Api from "@/api/ApiMethod";
import { getActiveAssignmentsByFaculty } from "@/api/Services/FacultyAssignmentService";
import { getStudentCoursesBySemester, getLearnerSemesters } from "@/api/Services/SemesterService";

jest.mock("@/api/ApiMethod", () => ({ __esModule: true, default: { get: jest.fn() } }));

beforeEach(() => { Api.get.mockReset().mockResolvedValue({ data: { data: [] } }); });

test("Faculty listing passes abort signal and avoids duplicate 403 retry", async () => {
  const signal = new AbortController().signal;
  await getActiveAssignmentsByFaculty(7, { signal });
  expect(Api.get).toHaveBeenCalledWith("/api/v1/teaching-assignment/byFaculty/7/active", {
    signal, _retry403: true,
  });
});

test("Learner semester selection preserves the chosen semester and bypasses 403 replay", async () => {
  const signal = new AbortController().signal;
  await getStudentCoursesBySemester(11, { semesterId: 17, signal });
  expect(Api.get).toHaveBeenCalledWith("/api/v1/student-courses/byStudent/11?semesterId=17", {
    signal, _retry403: true,
  });
});

test("Learner semester-option lookup bypasses duplicate authorization retry", async () => {
  const signal = new AbortController().signal;
  await getLearnerSemesters(11, { signal });
  expect(Api.get).toHaveBeenCalledWith("/api/v1/student-courses/byStudent/11/semesters", {
    signal, _retry403: true,
  });
});
