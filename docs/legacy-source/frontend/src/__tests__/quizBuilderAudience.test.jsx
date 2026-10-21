import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import QuizBuilderModal from "@/components/Quiz/QuizBuilderModal";
import { getQuizV2 } from "@/api/Services/quizServices";
import { getClassesForCourseSyllabus } from "@/api/Services/adminServices/departmentService";

jest.mock("@/api/Services/quizServices", () => ({
  createQuizV2: jest.fn(),
  getQuizV2: jest.fn(),
  updateQuizV2: jest.fn(),
}));

jest.mock("@/api/Services/adminServices/departmentService", () => ({
  getClassesForCourseSyllabus: jest.fn(),
}));

describe("QuizBuilderModal current course audience", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClassesForCourseSyllabus.mockResolvedValue({ 9: "CSE-A", 10: "CSE-B" });
  });

  it("explains shared targeting as all currently eligible sections and loads only the course audience", async () => {
    render(
      <QuizBuilderModal
        open
        onClose={jest.fn()}
        onCreated={jest.fn()}
        lesson={{ lessonId: 7, lessonName: "Arrays" }}
        courseId={3}
        classId={null}
      />,
    );

    expect(screen.getByText("All currently eligible sections for this course")).toBeInTheDocument();
    expect(screen.getByText("One specific section")).toBeInTheDocument();
    await waitFor(() => expect(getClassesForCourseSyllabus).toHaveBeenCalledWith({ courseId: 3 }));
  });

  it("keeps a historical quiz scope readable without treating it as a new current target", async () => {
    getQuizV2.mockResolvedValue({
      id: 55,
      lessonId: 7,
      courseId: 3,
      classId: 91,
      title: "Old cohort quiz",
      dueAt: "2026-10-20T10:00:00",
      maxAttempts: 1,
      status: "DRAFT",
      shuffleQuestions: false,
      shuffleOptions: false,
      questions: [],
    });
    getClassesForCourseSyllabus.mockResolvedValue({ 91: "CSE-2024 (historical scope)" });

    render(
      <QuizBuilderModal
        open
        onClose={jest.fn()}
        onCreated={jest.fn()}
        lesson={{ lessonId: 7, lessonName: "Arrays" }}
        courseId={3}
        quizId={55}
      />,
    );

    await waitFor(() => expect(getClassesForCourseSyllabus).toHaveBeenCalledWith({
      courseId: 3,
      includeHistoricalClassId: 91,
    }));
    expect(await screen.findByText("One specific section · CSE-2024 (historical scope)")).toBeInTheDocument();
  });
});


it("failed edit load stays visibly failed and cannot save an empty replacement", async () => {
  getQuizV2.mockRejectedValueOnce(new Error("quiz service unavailable"));
  const onClose = jest.fn();

  render(
    <QuizBuilderModal
      open
      onClose={onClose}
      onCreated={jest.fn()}
      lesson={{ lessonId: 7, lessonName: "Arrays" }}
      courseId={3}
      quizId={55}
    />,
  );

  expect(await screen.findByText("Could not load this quiz for editing")).toBeInTheDocument();
  expect(screen.getByText("quiz service unavailable")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  expect(onClose).not.toHaveBeenCalled();
});

it("failed section lookup is explicit and never described as zero eligible sections", async () => {
  getClassesForCourseSyllabus.mockRejectedValueOnce(new Error("audience unavailable"));

  render(
    <QuizBuilderModal
      open
      onClose={jest.fn()}
      onCreated={jest.fn()}
      lesson={{ lessonId: 7, lessonName: "Arrays" }}
      courseId={3}
      classId={null}
    />,
  );

  expect(await screen.findByText("Eligible sections unavailable")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry sections" })).toBeInTheDocument();
  expect(screen.getByLabelText("One specific section")).toBeDisabled();
  expect(screen.queryByText("No current section is eligible for this course.")).not.toBeInTheDocument();
});

it("a changed quiz draft asks before being discarded", async () => {
  const onClose = jest.fn();
  render(
    <QuizBuilderModal
      open
      onClose={onClose}
      onCreated={jest.fn()}
      lesson={{ lessonId: 7, lessonName: "Arrays" }}
      courseId={3}
      classId={null}
    />,
  );

  fireEvent.change(screen.getByPlaceholderText("Example: Java basics checkpoint"), { target: { value: "Changed draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

  expect(await screen.findByText("Discard this quiz draft?")).toBeInTheDocument();
  expect(screen.getByText("Your unsaved changes will be lost.")).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});
