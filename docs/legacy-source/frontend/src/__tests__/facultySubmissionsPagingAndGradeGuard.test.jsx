import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Faculty audit F-048/F-049/F-052.
jest.mock("@/api/ApiMethod", () => ({ __esModule: true, default: { get: jest.fn(), patch: jest.fn(), post: jest.fn() }, request: jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({ getFileUrl: jest.fn().mockResolvedValue("") }));

const Api = require("@/api/ApiMethod").default;
const { getAssignmentSubmissions } = require("@/api/Services/courseServices");
const ViewSubmissionsModal = require("@/pages/Dashboard/course/syllabus/viewSubmissionsModal").default;

const page = (content, number, totalPages) => ({ data: { data: { content, number, totalPages, totalElements: 250 } } });
const rows = (from, n) => Array.from({ length: n }, (_, i) => ({ id: from + i, studentId: 1000 + from + i, lessonContentId: 77 }));

beforeEach(() => jest.clearAllMocks());

test("all: true follows every page instead of stopping at the first 100 (F-049/F-052)", async () => {
  Api.get
    .mockResolvedValueOnce(page(rows(1, 100), 0, 3))
    .mockResolvedValueOnce(page(rows(101, 100), 1, 3))
    .mockResolvedValueOnce(page(rows(201, 50), 2, 3));

  const res = await getAssignmentSubmissions({ lessonContentId: 77, all: true });

  expect(res.data).toHaveLength(250);
  expect(Api.get).toHaveBeenCalledTimes(3);
  expect(Api.get.mock.calls[2][1].params).toEqual({ lessonContentId: 77, page: 2, size: 100 });
});

test("a failed later page fails the whole load rather than returning a silently short list", async () => {
  Api.get.mockResolvedValueOnce(page(rows(1, 100), 0, 2)).mockRejectedValueOnce(new Error("boom"));
  await expect(getAssignmentSubmissions({ lessonContentId: 77, all: true })).rejects.toThrow("boom");
});

test("a submission from another assignment is never graded (F-048)", async () => {
  Api.get.mockResolvedValueOnce(page([{ id: 5, studentId: 9, studentFirstName: "Asha", lessonContentId: 41 }], 0, 1));

  render(<ViewSubmissionsModal open selectedViewAssignment={{ id: 77, contentTitle: "Week 2" }} onClose={() => {}} />);

  const input = await screen.findByPlaceholderText("Grade points");
  fireEvent.change(input, { target: { value: "7" } });
  fireEvent.click(screen.getByRole("button", { name: /submit grade/i }));

  await waitFor(() => expect(screen.getByText(/belongs to a different assignment/i)).toBeInTheDocument());
  expect(Api.patch).not.toHaveBeenCalled();
  expect(Api.post).not.toHaveBeenCalled();
});
