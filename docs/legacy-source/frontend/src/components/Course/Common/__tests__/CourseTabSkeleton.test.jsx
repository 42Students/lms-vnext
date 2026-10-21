import React from "react";
import { render } from "@testing-library/react";
import CourseTabSkeleton from "../CourseTabSkeleton";

describe("CourseTabSkeleton", () => {
  test("a faculty home tab gets the command-bar + priority-card shape, not the generic 4-card grid", () => {
    const { container } = render(<CourseTabSkeleton tab="home" isTeacherRole />);
    expect(container.querySelector(".course-skeleton__command")).toBeInTheDocument();
    expect(container.querySelector(".course-skeleton__priorities")).toBeInTheDocument();
    expect(container.querySelectorAll(".course-skeleton__priority-card")).toHaveLength(4);
    expect(container.querySelector(".course-skeleton__cards")).not.toBeInTheDocument();
  });

  test("a learner (or unspecified role) home tab keeps the original generic overview shape", () => {
    const { container } = render(<CourseTabSkeleton tab="home" />);
    expect(container.querySelector(".course-skeleton__cards")).toBeInTheDocument();
    expect(container.querySelector(".course-skeleton__command")).not.toBeInTheDocument();
  });

  test("isTeacherRole only changes the home tab -- other tabs are unaffected", () => {
    const { container } = render(<CourseTabSkeleton tab="students" isTeacherRole />);
    expect(container.querySelector(".course-skeleton--table")).toBeInTheDocument();
    expect(container.querySelector(".course-skeleton__command")).not.toBeInTheDocument();
  });

  test("an unknown tab falls back to the generic overview shape", () => {
    const { container } = render(<CourseTabSkeleton tab="not-a-real-tab" />);
    expect(container.querySelector(".course-skeleton--overview")).toBeInTheDocument();
  });
});
