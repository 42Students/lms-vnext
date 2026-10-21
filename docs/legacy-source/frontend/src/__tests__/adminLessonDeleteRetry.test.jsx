/**
 * Super admin Lessons: the delete guard must clear after every attempt. It used to stay set after the first delete,
 * so a failed delete (or a second lesson) silently did nothing until the page was reloaded.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Lessons from "@/pages/superadmin/sections/Lessons";
import { deleteLesson, getCoursesByCollege, getLessonsByCourse } from "@/api/Services/AdminService";

jest.setTimeout(30000);
jest.mock("next/router", () => ({ useRouter: () => ({ query: {}, pathname: "/superadmin", push: jest.fn(), replace: jest.fn() }) }));
jest.mock("@/api/Services/AdminService", () => ({
  createLesson: jest.fn(), getLessonsByCourse: jest.fn(), getCoursesByCollege: jest.fn(), updateLesson: jest.fn(),
  deleteLesson: jest.fn(), bulkUpdateLessonStatus: jest.fn(), reorderLessons: jest.fn(),
  fetchWithErrorHandling: async (call) => {
    try { const response = await call; return { success: true, data: response?.data?.data ?? response?.data }; }
    catch (error) { return { success: false, message: error?.message }; }
  },
}));

const LESSONS = [
  { id: 1, lessonName: "Loops", courseId: 5, sequence: 1, active: true },
  { id: 2, lessonName: "Arrays", courseId: 5, sequence: 2, active: true },
];

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.setItem("admin-lessons-selected-course:7", "5");
  getCoursesByCollege.mockResolvedValue({ data: [{ id: 5, course_name: "Programming" }] });
  getLessonsByCourse.mockResolvedValue({ data: LESSONS });
});

async function deleteByName(name) {
  fireEvent.click(await screen.findByRole("button", { name: `Delete lesson ${name}` }));
  const confirm = await screen.findByRole("dialog");
  fireEvent.change(confirm.querySelector("input"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: /Delete lesson and its files$/ }));
}

test("after a failed delete, trying again really sends the delete", async () => {
  deleteLesson.mockRejectedValueOnce(new Error("Server busy")).mockResolvedValueOnce({});
  render(<Lessons collegeId={7} />);

  await deleteByName("Loops");
  await waitFor(() => expect(deleteLesson).toHaveBeenCalledTimes(1));

  // The dialog stays open after the failure; once its spinner stops, OK must work again.
  await waitFor(() => expect(screen.getByRole("button", { name: /Delete lesson and its files$/ }).querySelector(".anticon-loading")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: /Delete lesson and its files$/ }));
  await waitFor(() => expect(deleteLesson).toHaveBeenCalledTimes(2));
  expect(deleteLesson).toHaveBeenLastCalledWith(1);
});
