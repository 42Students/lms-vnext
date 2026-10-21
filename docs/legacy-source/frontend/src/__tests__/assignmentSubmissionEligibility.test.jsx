import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ViewAssignmentDrawer from "@/components/Assignments/ViewAssignmentModal";
import { getSubmittedAssign } from "@/api/Services/courseServices";

jest.mock("react-redux", () => ({
  useSelector: () => ({ id: 42, userType: "LEARNER" }),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/dynamic", () => () => function DynamicStub() {
  return null;
});

jest.mock("interweave", () => ({
  Markup: ({ content }) => <div>{content}</div>,
}));

jest.mock("@/api/Services/courseServices", () => ({
  getSubmittedAssign: jest.fn(),
}));

jest.mock("@/api/Services/AdminService", () => ({
  getFileUrl: jest.fn(() => Promise.resolve("")),
}));

jest.mock("@/components/Assignments/SubmitAssignmentModal", () => function SubmitAssignmentModal() {
  return <div data-testid="submit-assignment-modal">Submit modal</div>;
});

jest.mock("@/components/Global/RightDrawer/DrawerWidget", () => function DrawerWidget({
  children,
  secondaryButtonTitle,
  onClickSecondary,
  disableSecondary,
}) {
  return (
    <div>
      {children}
      {secondaryButtonTitle ? (
        <button type="button" onClick={onClickSecondary} disabled={disableSecondary}>
          {secondaryButtonTitle}
        </button>
      ) : null}
    </div>
  );
});

jest.mock("@/utils/assignmentSchema", () => ({
  ASSIGNMENT_RESOURCE_TYPES: {
    INSTRUCTIONS: "INSTRUCTIONS",
    PDF: "PDF",
    FILE: "FILE",
    LINK: "LINK",
  },
  getSubmissionTypeLabel: (value) => value,
  normalizeAllowedSubmissionTypes: () => ["WRITTEN_RESPONSE"],
  normalizeAssignmentResources: () => [],
  normalizeSubmissionResources: () => [],
}));

const assignmentContent = {
  record: {
    id: 9,
    contentTitle: "Essay",
    contentDataDTO: { due_date: "2099-01-01T10:00:00" },
  },
};

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("keeps assignment submit disabled until existing-submission status is known", async () => {
  const request = deferred();
  getSubmittedAssign.mockReturnValue(request.promise);

  render(
    <ViewAssignmentDrawer
      open
      onClose={jest.fn()}
      assignmentContent={assignmentContent}
    />
  );

  expect(screen.getByRole("button", { name: "Checking submission…" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Submit Your Work" })).not.toBeInTheDocument();

  await act(async () => {
    request.resolve({ data: [] });
    await request.promise;
  });

  expect(screen.getByRole("button", { name: "Submit Your Work" })).toBeEnabled();
});

test("failed submission lookup stays fail-closed and can be retried", async () => {
  getSubmittedAssign
    .mockRejectedValueOnce(new Error("network unavailable"))
    .mockResolvedValueOnce({ data: [] });

  render(
    <ViewAssignmentDrawer
      open
      onClose={jest.fn()}
      assignmentContent={assignmentContent}
    />
  );

  expect(await screen.findByText("We couldn't verify your submission status")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Submit Your Work" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));

  expect(await screen.findByRole("button", { name: "Submit Your Work" })).toBeEnabled();
  expect(getSubmittedAssign).toHaveBeenCalledTimes(2);
});

test("already-submitted assignment exposes view instead of another submit", async () => {
  getSubmittedAssign.mockResolvedValue({
    data: [{ id: 100, lessonContentId: 9, submission_type: "WRITTEN_RESPONSE" }],
  });

  render(
    <ViewAssignmentDrawer
      open
      onClose={jest.fn()}
      assignmentContent={assignmentContent}
    />
  );

  expect(await screen.findByRole("button", { name: "View Submission" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Submit Your Work" })).not.toBeInTheDocument();
});

test("known not-submitted state opens the submission flow", async () => {
  getSubmittedAssign.mockResolvedValue({ data: [] });

  render(
    <ViewAssignmentDrawer
      open
      onClose={jest.fn()}
      assignmentContent={assignmentContent}
    />
  );

  fireEvent.click(await screen.findByRole("button", { name: "Submit Your Work" }));
  expect(screen.getByTestId("submit-assignment-modal")).toBeInTheDocument();
});
