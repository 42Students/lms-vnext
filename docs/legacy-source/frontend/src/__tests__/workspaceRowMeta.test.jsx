import React from "react";
import { render, screen } from "@testing-library/react";
import { TeamMembersTable, sprintRowMeta, taskRowMeta, TeamGroupNotice } from "@/components/admin/projects/workspaceRowMeta";

jest.mock("@/api/Services/AdminService", () => ({ reconcileProjectTeam: jest.fn() }));

const workspace = {
  teamGroupId: 2,
  resolvedTasks: [
    { sprintKey: "s02", status: "DONE", assigneeId: 161, updatedAt: [2026, 10, 3, 5, 59, 11] },
    { sprintKey: "s02", status: "IN_REVIEW", assigneeId: 161, updatedAt: [2026, 10, 1, 5, 0, 0] },
    { sprintKey: "s02", status: "TO_DO", assigneeId: 162 },
  ],
};
const members = [
  { userId: 161, name: "Nikhil Kumar", userType: "LEARNER" },
  { userId: 162, name: "Harini Rao", userType: "LEARNER" },
  { userId: 159, name: "Akhil Varma", userType: "LEARNER" },
  { userId: 21, name: "Rajesh Mentor", userType: "FACULTY" },
];
const roleOf = (m) => (m.userType === "FACULTY" ? { label: "Mentor", color: "blue" } : { label: "Project Contributor", color: "green" });

describe("shared workspace tab pieces", () => {
  test("members table shows each learner's work and flags learners with none", () => {
    render(<TeamMembersTable workspace={workspace} members={members} roleOf={roleOf} />);
    expect(screen.getByText("Nikhil Kumar")).toBeInTheDocument();
    expect(screen.getByText("1 · 1 · 0")).toBeInTheDocument(); // done · in review · in progress
    expect(screen.getAllByText("None")).toHaveLength(1); // Akhil has no task
  });

  test("sprint row summary counts the sprint's tasks", () => {
    render(<div>{sprintRowMeta(workspace)({ sprintKey: "s02", sprintState: "ACTIVE" })}</div>);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("1/3 tasks done")).toBeInTheDocument();
  });

  test("task row summary shows status and owner", () => {
    render(<div>{taskRowMeta({ status: "IN_REVIEW", assigneeName: "Nikhil Kumar", sprintLabel: "Sprint 2" })}</div>);
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(screen.getByText("Nikhil Kumar")).toBeInTheDocument();
  });

  test("team notice only for team workspaces", () => {
    const { container, rerender } = render(<TeamGroupNotice workspace={{}} workspaceId="w" collegeId={6} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<TeamGroupNotice workspace={workspace} workspaceId="w" collegeId={6} />);
    expect(screen.getByText("This workspace is a team")).toBeInTheDocument();
  });
});
