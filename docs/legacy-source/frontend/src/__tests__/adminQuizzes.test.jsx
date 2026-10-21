import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Modal } from "antd";
import Quizzes from "@/pages/superadmin/sections/Quizzes";
import { getCoursesByCollege, getLessonsByCourse } from "@/api/Services/AdminService";
import { getQuizSubmissionsV2, listAdminQuizzesV2 } from "@/api/Services/quizServices";

jest.mock("@/api/Services/AdminService", () => ({
  getCoursesByCollege: jest.fn(),
  getLessonsByCourse: jest.fn(),
  getClassesByCollege: jest.fn(() => Promise.resolve({ data: [] })),
}));

jest.mock("@/api/Services/quizServices", () => ({
  listAdminQuizzesV2: jest.fn(),
  deleteQuizV2: jest.fn(),
  publishQuizV2: jest.fn(),
  getQuizSubmissionsV2: jest.fn(),
  publishQuizGradesV2: jest.fn(),
  unpublishQuizGradesV2: jest.fn(),
}));

jest.mock("@/components/Quiz/QuizBuilderModal", () =>
  function QuizBuilderModalMock({ metadataOnly }) {
    return <div data-testid="quiz-builder" data-metadata-only={String(Boolean(metadataOnly))} />;
  });

jest.mock("@/utils/csvExport", () => ({ exportRowsToCsv: jest.fn() }));

jest.mock("antd", () => {
  const React = require("react");
  const actual = jest.requireActual("antd");
  return {
    ...actual,
    message: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
    Popconfirm: ({ children }) => <span>{children}</span>,
    Select: ({ placeholder, options = [], value, disabled, onChange }) => (
      <label>
        {placeholder}
        <select disabled={disabled} value={value ?? ""} onChange={(event) => onChange?.(event.target.value ? Number(event.target.value) : null)}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    ),
    Table: ({ columns, dataSource = [] }) => (
      <div data-testid="quizzes-table">
        {dataSource.map((record) => (
          <div key={record.id}>
            {columns.map((column, index) => (
              <div key={column.key ?? index}>
                {column.render ? column.render(record[column.dataIndex], record) : String(record[column.dataIndex] ?? "")}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  };
});

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
};

describe("admin quiz college scope hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listAdminQuizzesV2.mockResolvedValue({ content: [], totalElements: 0 });
    getCoursesByCollege.mockResolvedValue({ data: { data: [] } });
  });

  it("opens metadata-only mode after submissions so the backend does not receive a question rewrite", async () => {
    listAdminQuizzesV2.mockResolvedValue({ content: [{ id: 88, title: "Quiz after attempts", courseId: 11, status: "PUBLISHED" }], totalElements: 1 });
    getQuizSubmissionsV2.mockResolvedValue([{ id: 301, learnerId: 5 }]);
    const confirm = jest.spyOn(Modal, "confirm").mockImplementation(({ onOk }) => {
      onOk();
      return { destroy: jest.fn() };
    });
    try {
      render(<Quizzes collegeId={7} />);
      fireEvent.click(await screen.findByText("Edit"));
      await waitFor(() => expect(screen.getByTestId("quiz-builder")).toHaveAttribute("data-metadata-only", "true"));
      expect(getQuizSubmissionsV2).toHaveBeenCalledWith(88);
    } finally {
      confirm.mockRestore();
    }
  });

  it("ignores a superseded lesson response when the new quiz course changes", async () => {
  const older = deferred();
  getCoursesByCollege.mockResolvedValue({ data: { data: [
    { id: 11, course_name: "Older course" }, { id: 22, course_name: "Current course" },
  ] } });
  getLessonsByCourse.mockReturnValueOnce(older.promise)
    .mockResolvedValueOnce({ data: { data: [{ id: 202, lesson_name: "Current lesson" }] } });
  render(<Quizzes collegeId={7} />);
  await screen.findAllByText("Older course");
  fireEvent.change(screen.getByLabelText("Course for new quiz"), { target: { value: "11" } });
  await waitFor(() => expect(getLessonsByCourse).toHaveBeenCalledWith(11));
  fireEvent.change(screen.getByLabelText("Course for new quiz"), { target: { value: "22" } });
  expect((await screen.findAllByText("Current lesson")).length).toBeGreaterThan(0);
  await act(async () => {
    older.resolve({ data: { data: [{ id: 101, lesson_name: "Stale lesson" }] } });
    await older.promise;
  });
  expect(screen.queryByText("Stale lesson")).not.toBeInTheDocument();
});

it("clears previous college course and lesson selections on a valid college switch", async () => {
  getCoursesByCollege.mockResolvedValue({ data: { data: [{ id: 11, course_name: "First college course" }] } });
  getLessonsByCourse.mockResolvedValue({ data: { data: [{ id: 101, lesson_name: "First college lesson" }] } });
  const { rerender } = render(<Quizzes collegeId={7} />);
  await screen.findAllByText("First college course");
  fireEvent.change(screen.getByLabelText("Course for new quiz"), { target: { value: "11" } });
  await screen.findByText("First college lesson");
  fireEvent.change(screen.getByLabelText("Lesson for new quiz"), { target: { value: "101" } });
  expect(screen.getByLabelText("Lesson for new quiz")).toHaveValue("101");
  rerender(<Quizzes collegeId={8} />);
  await waitFor(() => expect(screen.getByLabelText("Course for new quiz")).toHaveValue(""));
  expect(screen.getByLabelText("Lesson for new quiz")).toHaveValue("");
  expect(screen.getByRole("button", { name: /Create quiz/ })).toBeDisabled();
});

  it("drops an open old-college editor, quiz rows and course choices on college switch", async () => {
    const pendingCourses = deferred();
    const pendingQuizzes = deferred();
    getCoursesByCollege
      .mockResolvedValueOnce({ data: { data: [{ id: 11, course_name: "Prior college course" }] } })
      .mockReturnValueOnce(pendingCourses.promise);
    listAdminQuizzesV2
      .mockResolvedValueOnce({ content: [{ id: 88, title: "Prior college quiz", courseId: 11, status: "DRAFT" }], totalElements: 1 })
      .mockReturnValueOnce(pendingQuizzes.promise);
    getQuizSubmissionsV2.mockResolvedValue([]);
    const { rerender } = render(<Quizzes collegeId={7} />);
    await screen.findByText("Prior college quiz");
    await screen.findAllByText("Prior college course");
    fireEvent.click(screen.getByText("Edit"));
    await screen.findByTestId("quiz-builder");
    rerender(<Quizzes collegeId={8} />);
    await waitFor(() => {
      expect(screen.queryByTestId("quiz-builder")).not.toBeInTheDocument();
      expect(screen.queryByText("Prior college quiz")).not.toBeInTheDocument();
      expect(screen.queryByText("Prior college course")).not.toBeInTheDocument();
    });
    await act(async () => {
      pendingCourses.resolve({ data: { data: [{ id: 22, course_name: "Current college course" }] } });
      pendingQuizzes.resolve({ content: [{ id: 99, title: "Current college quiz", courseId: 22 }], totalElements: 1 });
      await Promise.all([pendingCourses.promise, pendingQuizzes.promise]);
    });
    expect(screen.queryByText("Prior college quiz")).not.toBeInTheDocument();
    expect(screen.queryByText("Prior college course")).not.toBeInTheDocument();
  });

  it("ignores an old-college edit result that resolves after switching colleges", async () => {
    const pendingEdit = deferred();
    listAdminQuizzesV2.mockResolvedValueOnce({ content: [{ id: 88, title: "Former quiz", courseId: 11 }], totalElements: 1 })
      .mockResolvedValueOnce({ content: [], totalElements: 0 });
    getQuizSubmissionsV2.mockReturnValueOnce(pendingEdit.promise);
    const { rerender } = render(<Quizzes collegeId={7} />);
    fireEvent.click(await screen.findByText("Edit"));
    await waitFor(() => expect(getQuizSubmissionsV2).toHaveBeenCalledWith(88));
    rerender(<Quizzes collegeId={8} />);
    await act(async () => {
      pendingEdit.resolve([]);
      await pendingEdit.promise;
    });
    expect(screen.queryByTestId("quiz-builder")).not.toBeInTheDocument();
    expect(screen.queryByText("Former quiz")).not.toBeInTheDocument();
  });

  it("ignores old-college edit confirmation accepted after switching colleges", async () => {
    listAdminQuizzesV2.mockResolvedValueOnce({ content: [{ id: 88, title: "Former quiz", courseId: 11 }], totalElements: 1 })
      .mockResolvedValueOnce({ content: [], totalElements: 0 });
    getQuizSubmissionsV2.mockResolvedValue([{ id: 1 }]);
    let confirmOk;
    const confirm = jest.spyOn(Modal, "confirm").mockImplementation(({ onOk }) => {
      confirmOk = onOk;
      return { destroy: jest.fn() };
    });
    try {
      const { rerender } = render(<Quizzes collegeId={7} />);
      fireEvent.click(await screen.findByText("Edit"));
      await waitFor(() => expect(confirmOk).toEqual(expect.any(Function)));
      rerender(<Quizzes collegeId={8} />);
      await act(async () => { confirmOk(); });
      expect(screen.queryByTestId("quiz-builder")).not.toBeInTheDocument();
    } finally { confirm.mockRestore(); }
  });

  it("does not call scoped quiz or course APIs for an invalid college id", async () => {
    render(<Quizzes collegeId={0} />);

    expect(await screen.findByText("Select a College to manage quizzes")).toBeInTheDocument();
    expect(getCoursesByCollege).not.toHaveBeenCalled();
    expect(listAdminQuizzesV2).not.toHaveBeenCalled();
  });

  it("ignores a stale course response after the college changes", async () => {
    const stale = deferred();
    getCoursesByCollege
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce({ data: { data: [{ id: 22, course_name: "Current college course" }] } });

    const { rerender } = render(<Quizzes collegeId={7} />);
    rerender(<Quizzes collegeId={8} />);

    expect((await screen.findAllByText("Current college course")).length).toBeGreaterThan(0);

    await act(async () => {
      stale.resolve({ data: { data: [{ id: 11, course_name: "Old college course" }] } });
      await stale.promise;
    });

    await waitFor(() => expect(screen.queryByText("Old college course")).not.toBeInTheDocument());
    expect(getCoursesByCollege).toHaveBeenCalledWith(7);
    expect(getCoursesByCollege).toHaveBeenCalledWith(8);
  });
});
