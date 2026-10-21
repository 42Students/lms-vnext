import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import LearnerDetail from "@/pages/learn/projects/[projectId]";
import MentorDetail from "@/pages/mentor/projects/[projectId]";

let mockUser;
let mockQuery;
jest.mock("react-redux", () => ({ useSelector: (select) => select({ loginUser: mockUser }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ query: mockQuery }) }));
jest.mock("@/components/Projects/ProjectDetailContent", () => {
  const React = require("react");
  return function MockDetail() {
    const [count, setCount] = React.useState(0);
    return <button onClick={() => setCount((v) => v + 1)}>Detail state {count}</button>;
  };
});

beforeEach(() => {
  mockUser = { id: 42, userType: "LEARNER", organizationId: 2, collegeId: 7 };
  mockQuery = { projectId: "101", tab: "tasks" };
});

it("resets learner project detail when switching colleges with the same project ID", () => {
  const view = render(<LearnerDetail />);
  fireEvent.click(screen.getByRole("button", { name: "Detail state 0" }));
  mockUser = { ...mockUser, collegeId: 8 };
  view.rerender(<LearnerDetail />);
  expect(screen.getByRole("button", { name: "Detail state 0" })).toBeInTheDocument();
});

it("resets mentor project detail when switching account or organization", () => {
  mockUser = { id: 15, userType: "FACULTY", organizationId: 2, collegeId: 7, facultyType: "MENTOR" };
  const view = render(<MentorDetail />);
  fireEvent.click(screen.getByRole("button", { name: "Detail state 0" }));
  mockUser = { ...mockUser, organizationId: 3 };
  view.rerender(<MentorDetail />);
  expect(screen.getByRole("button", { name: "Detail state 0" })).toBeInTheDocument();
});

it("does not remount learner project detail when only its tab query changes", () => {
  const view = render(<LearnerDetail />);
  fireEvent.click(screen.getByRole("button", { name: "Detail state 0" }));
  mockQuery = { projectId: "101", tab: "meetings" };
  view.rerender(<LearnerDetail />);
  expect(screen.getByRole("button", { name: "Detail state 1" })).toBeInTheDocument();
});

it("remounts mentor project detail when project ID changes", () => {
  const view = render(<MentorDetail />);
  fireEvent.click(screen.getByRole("button", { name: "Detail state 0" }));
  mockQuery = { projectId: "102", tab: "tasks" };
  view.rerender(<MentorDetail />);
  expect(screen.getByRole("button", { name: "Detail state 0" })).toBeInTheDocument();
});
