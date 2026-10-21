import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import ViewAssignmentDrawer from "@/components/Assignments/ViewAssignmentModal";
import { getSubmittedAssign } from "@/api/Services/courseServices";

jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/api/Services/courseServices", () => ({
  getSubmittedAssign: jest.fn(),
}));
jest.mock("@/api/Services/AdminService", () => ({
  getFileUrl: jest.fn(),
}));
jest.mock("@/components/Global/RightDrawer/DrawerWidget", () => function MockDrawer({
  drawerOpen,
  title,
  children,
  secondaryButtonTitle,
  onClickSecondary,
  disableSecondary,
}) {
  if (!drawerOpen) return null;
  return (
    <div>
      <h1>{title}</h1>
      {children}
      {secondaryButtonTitle ? (
        <button type="button" onClick={onClickSecondary} disabled={disableSecondary}>
          {secondaryButtonTitle}
        </button>
      ) : null}
    </div>
  );
});
jest.mock("@/components/Assignments/SubmitAssignmentModal", () => function MockSubmitAssignmentModal({
  open,
  onClose,
  onSubmitted,
}) {
  if (!open) return null;
  return (
    <button
      type="button"
      onClick={() => {
        onSubmitted?.({ id: 9001 });
        onClose?.();
      }}
    >
      Complete mocked submission
    </button>
  );
});
jest.mock("next/dynamic", () => () => function MockDynamicComponent() { return null; });

const assignment = {
  id: 77,
  contentTitle: "State-safe assignment",
  contentDataDTO: {
    due_date: "2030-01-01T10:00:00.000Z",
    allowed_submission_types: ["WRITTEN_RESPONSE"],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  useSelector.mockImplementation((selector) => selector({
    loginUser: { id: 5, userType: "LEARNER" },
  }));
  useRouter.mockReturnValue({ push: jest.fn() });
});

test("submission lookup failure never falls back to an enabled Submit Your Work action", async () => {
  getSubmittedAssign
    .mockRejectedValueOnce(new Error("network down"))
    .mockResolvedValueOnce({ data: [] });

  render(
    <ViewAssignmentDrawer
      open
      onClose={() => {}}
      assignmentContent={{ record: assignment }}
    />
  );

  expect(await screen.findByText("We couldn't verify your submission status")).toBeInTheDocument();

  const unavailable = screen.getByRole("button", { name: "Submission status unavailable" });
  expect(unavailable).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Submit Your Work" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("button", { name: "Submit Your Work" })).toBeEnabled();
});

test("assignment with no deadline fails closed and never exposes Submit Your Work", async () => {
  getSubmittedAssign.mockResolvedValue({ data: [] });
  const missingDeadlineAssignment = {
    ...assignment,
    deadline: null,
    contentDataDTO: {
      ...assignment.contentDataDTO,
      due_date: null,
    },
  };

  render(
    <ViewAssignmentDrawer
      open
      onClose={() => {}}
      assignmentContent={{ record: missingDeadlineAssignment }}
    />
  );

  expect(await screen.findByText("Submission unavailable · deadline missing")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submission unavailable" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Submit Your Work" })).not.toBeInTheDocument();
  expect(screen.getByText("This assignment does not have a valid deadline. Submitting is disabled until faculty corrects it.")).toBeInTheDocument();
});

test("a past-due unsubmitted assignment is closed and never exposes Submit Your Work", async () => {
  getSubmittedAssign.mockResolvedValue({ data: [] });
  const expiredAssignment = {
    ...assignment,
    deadline: "2020-01-01T00:00:00+05:30",
    contentDataDTO: {
      ...assignment.contentDataDTO,
      due_date: "2030-01-01T10:00:00.000Z",
    },
  };

  render(
    <ViewAssignmentDrawer
      open
      onClose={() => {}}
      assignmentContent={{ record: expiredAssignment }}
    />
  );

  expect(await screen.findByText("Closed · not submitted")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submission closed" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Submit Your Work" })).not.toBeInTheDocument();
  expect(screen.getByText("Submissions are closed")).toBeInTheDocument();
});

test("an existing submission exposes View Submission instead of a duplicate submit action", async () => {
  getSubmittedAssign.mockResolvedValue({
    data: [{ id: 12, lessonContentId: 77, submission_assets: [] }],
  });

  render(
    <ViewAssignmentDrawer
      open
      onClose={() => {}}
      assignmentContent={{ record: assignment }}
    />
  );

  expect(await screen.findByRole("button", { name: "View Submission" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Submit Your Work" })).not.toBeInTheDocument();
});

test("successful submission refreshes the parent state before another submit can be offered", async () => {
  getSubmittedAssign
    .mockResolvedValueOnce({ data: [] })
    .mockResolvedValueOnce({
      data: [{ id: 13, lessonContentId: 77, submission_assets: [] }],
    });

  render(
    <ViewAssignmentDrawer
      open
      onClose={() => {}}
      assignmentContent={{ record: assignment }}
    />
  );

  fireEvent.click(await screen.findByRole("button", { name: "Submit Your Work" }));
  fireEvent.click(await screen.findByRole("button", { name: "Complete mocked submission" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "View Submission" })).toBeEnabled();
  });
  expect(screen.queryByRole("button", { name: "Submit Your Work" })).not.toBeInTheDocument();
});
