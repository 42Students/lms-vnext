import { renderHook, waitFor } from "@testing-library/react";
import { useSelector } from "react-redux";
import useCourses from "../useCourses";
import { getFacultyProgram } from "@/api/Services/courseServices";

jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("@/api/Services/courseServices", () => ({
  getFacultyProgram: jest.fn(),
  getProgram: jest.fn(),
}));

function loginAsFaculty() {
  useSelector.mockImplementation((selector) =>
    selector({ loginUser: { id: 15, userType: "FACULTY", isUserLoggedIn: true } })
  );
}

describe("useCourses — faculty branch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("maps getFacultyProgram's flat {courseId, courseName} rows into a course list, deduped by course", async () => {
    loginAsFaculty();
    // This is the ACTUAL shape getFacultyProgram (getActiveAssignmentsByFaculty) returns -- flat,
    // never nested under `item.course` -- one row per teaching assignment, so the same course can
    // appear twice (two class sections).
    getFacultyProgram.mockResolvedValue({
      data: {
        data: [
          { id: 1, courseId: 3, courseName: "MERN Stack Training", classId: 12 },
          { id: 2, courseId: 3, courseName: "MERN Stack Training", classId: 13 },
          { id: 3, courseId: 7, courseName: "Java Programming", classId: 12 },
        ],
      },
    });

    const { result } = renderHook(() => useCourses());

    await waitFor(() => expect(result.current[0]).toHaveLength(2));
    const [courses] = result.current;
    expect(courses.map((c) => c.name)).toEqual(["MERN Stack Training", "Java Programming"]);
    expect(courses[0].id).toBe(3);
  });

  test("a faculty member with no teaching assignments gets an empty list, not an error", async () => {
    loginAsFaculty();
    getFacultyProgram.mockResolvedValue({ data: { data: [] } });

    const { result } = renderHook(() => useCourses());

    await waitFor(() => expect(result.current[2]).toBe(false));
    expect(result.current[0]).toEqual([]);
    expect(result.current[3]).toBeNull();
  });
});
