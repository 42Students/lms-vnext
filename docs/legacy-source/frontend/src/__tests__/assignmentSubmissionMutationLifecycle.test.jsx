import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import SubmitAssignmentModal from "@/components/Assignments/SubmitAssignmentModal";
import { submitAssignment } from "@/api/Services/courseServices";

jest.mock("react-redux", () => ({
  useSelector: () => ({ id: 42, userType: "LEARNER" }),
}));
jest.mock("@/api/Services/courseServices", () => ({
  submitAssignment: jest.fn(),
  saveContentProgress: jest.fn(() => Promise.resolve()),
}));
jest.mock("@/utils/uploadToR2", () => ({
  uploadFileViaPresign: jest.fn(),
}));
jest.mock("@/components/Global/Upload/UploadFromLinkButton", () => function UploadFromLinkButton() {
  return null;
});
jest.mock("@/components/Global/Editor/editor", () => function Editor({ setEditorContent }) {
  return <textarea aria-label="Written response" onChange={(event) => setEditorContent(event.target.value)} />;
});
jest.mock("@/components/Global/RightDrawer/DrawerWidget", () => function DrawerWidget({
  children,
  onClickPrimary,
  onClickSecondary,
  disablePrimary,
  disableSecondary,
  secondaryLoading,
}) {
  return (
    <div>
      {children}
      <button type="button" onClick={onClickPrimary} disabled={disablePrimary}>Cancel</button>
      <button type="button" onClick={onClickSecondary} disabled={disableSecondary}>
        {secondaryLoading ? "Submitting…" : "Submit"}
      </button>
    </div>
  );
});
jest.mock("@/utils/assignmentSchema", () => ({
  ASSIGNMENT_SUBMISSION_TYPES: {
    WRITTEN_RESPONSE: "WRITTEN_RESPONSE",
    PDF_UPLOAD: "PDF_UPLOAD",
    FILE_UPLOAD: "FILE_UPLOAD",
    REPOSITORY_LINK: "REPOSITORY_LINK",
    EXTERNAL_LINK: "EXTERNAL_LINK",
  },
  getSubmissionTypeLabel: (value) => value,
  normalizeAllowedSubmissionTypes: () => ["WRITTEN_RESPONSE"],
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("locks close and duplicate submit while assignment submission is pending", async () => {
  const request = deferred();
  submitAssignment.mockReturnValue(request.promise);
  const onClose = jest.fn();
  const onSubmitted = jest.fn();

  render(
    <SubmitAssignmentModal
      open
      onClose={onClose}
      onSubmitted={onSubmitted}
      assignment={{ id: 9, contentTitle: "Essay", deadline: "2099-01-01T23:59:59", contentDataDTO: {} }}
    />
  );

  fireEvent.change(screen.getByRole("textbox", { name: "Written response" }), { target: { value: "My answer" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  expect(submitAssignment).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Submitting…" }));
  expect(submitAssignment).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  await act(async () => {
    request.resolve({ data: { data: { id: 100, lessonContentId: 9 } } });
    await request.promise;
  });

  expect(onSubmitted).toHaveBeenCalledWith({ id: 100, lessonContentId: 9 });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("failed assignment submission stays open and exposes an inline retry", async () => {
  submitAssignment
    .mockRejectedValueOnce(new Error("network unavailable"))
    .mockResolvedValueOnce({ data: { data: { id: 101, lessonContentId: 9 } } });
  const onClose = jest.fn();

  render(
    <SubmitAssignmentModal
      open
      onClose={onClose}
      assignment={{ id: 9, contentTitle: "Essay", deadline: "2099-01-01T23:59:59", contentDataDTO: {} }}
    />
  );

  fireEvent.change(screen.getByRole("textbox", { name: "Written response" }), { target: { value: "My answer" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  expect(await screen.findByText("Assignment was not submitted")).toBeInTheDocument();
  expect(screen.getByText("network unavailable")).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => { await Promise.resolve(); });
  expect(submitAssignment).toHaveBeenCalledTimes(2);
});
