/** Profile verification: the student's card (what is missing, one button to send) and the verifier's page (review, verify, send back). */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Modal } from "antd";
import ProfileVerificationCard, { sectionAction } from "@/components/profile/ProfileVerificationCard";
import VerificationWorkspace, { changedFields } from "@/components/verification/VerificationWorkspace";
import {
  getMyVerification, getVerificationAccess, getVerificationQueue, getVerificationSettings, getVerificationStudent, saveVerificationSettings,
  sendBackSection, submitVerification, verifySection,
} from "@/api/Services/VerificationService";

jest.mock("@/api/Services/VerificationService", () => ({
  getMyVerification: jest.fn(), submitVerification: jest.fn(), getVerificationAccess: jest.fn(), getVerificationQueue: jest.fn(),
  getVerificationStudent: jest.fn(), verifySection: jest.fn(), sendBackSection: jest.fn(), verifyMany: jest.fn(),
  getVerificationSettings: jest.fn(), saveVerificationSettings: jest.fn(), getDocumentUrl: jest.fn(),
}));
jest.setTimeout(30000);
afterEach(() => Modal.destroyAll());
beforeEach(() => jest.clearAllMocks());

test("what the student can do with a section", () => {
  expect(sectionAction({ state: "INCOMPLETE", missing: ["Add your 10th"] })).toBeNull();
  expect(sectionAction({ state: "READY", missing: [] })).toBe("Send for verification");
  expect(sectionAction({ state: "SENT_BACK", missing: [] })).toBe("Send for verification");
  expect(sectionAction({ state: "VERIFIED", missing: [], changedSinceVerification: false })).toBeNull();
  expect(sectionAction({ state: "VERIFIED", missing: [], changedSinceVerification: true })).toBe("Send changes for verification");
  expect(sectionAction({ state: "SUBMITTED", missing: [] })).toBeNull();
});

test("the student sees what is missing, sends a ready section, and gets the badge once both are verified", async () => {
  getMyVerification.mockResolvedValueOnce({ data: { verified: false, sections: [
    { section: "EDUCATION", state: "INCOMPLETE", missing: ["Upload the marksheet for your 12th or Diploma"] },
    { section: "IDENTITY", state: "READY", missing: [] },
  ] } });
  submitVerification.mockResolvedValue({ data: {} });
  getMyVerification.mockResolvedValueOnce({ data: { verified: true, sections: [
    { section: "EDUCATION", state: "VERIFIED", missing: [], verifiedAt: "2026-10-04T10:00:00", verifiedByName: "Tina Officer" },
    { section: "IDENTITY", state: "VERIFIED", missing: [], verifiedAt: "2026-10-04T10:00:00", verifiedByName: "Tina Officer" },
  ] } });
  render(<ProfileVerificationCard />);
  expect(await screen.findByText("Upload the marksheet for your 12th or Diploma")).toBeInTheDocument();
  const identity = screen.getByTestId("profile.verification.IDENTITY");
  fireEvent.click(within(identity).getByRole("button", { name: "Send for verification" }));
  await waitFor(() => expect(submitVerification).toHaveBeenCalledWith("IDENTITY"));
  expect(await screen.findByTestId("profile.verified-badge")).toHaveTextContent("Verified profile");
  expect(screen.getAllByText(/Verified by Tina Officer on 4 Oct 2026/)).toHaveLength(2);
});

test("an update highlights exactly what changed", () => {
  const verified = { entries: [{ id: 1, educationType: "UG", grade: "8.4", maxGrade: "10" }], resumeUrl: "r" };
  const submitted = { entries: [{ id: 1, educationType: "UG", grade: "9.6", maxGrade: "10" }, { id: 2, educationType: "PG", grade: "8" }], resumeUrl: "r" };
  expect([...changedFields(verified, submitted)].sort()).toEqual(["1:grade", "2:*"]);
});

test("the verifier reviews a student, verifies one section and sends the other back with a reason", async () => {
  getVerificationAccess.mockResolvedValue({ data: { canVerify: true, collegeId: 6, counts: { SUBMITTED: 1, UPDATE_PENDING: 0, SENT_BACK: 0, VERIFIED: 3 } } });
  getVerificationSettings.mockResolvedValue({ data: { tpoCanVerify: true } });
  saveVerificationSettings.mockResolvedValue({ data: { tpoCanVerify: false } });
  getVerificationQueue.mockResolvedValue({ data: [{ learnerId: 77, section: "EDUCATION", status: "SUBMITTED", firstName: "Asha", rollNumber: "R1", branch: "CSE", submittedAt: "2026-10-04T09:00:00" }] });
  const detail = { student: { learnerId: 77, firstName: "Asha", rollNumber: "R1" }, history: [], sections: [
    { section: "EDUCATION", state: "SUBMITTED", submittedAt: "2026-10-04T09:00:00", submitted: { entries: [{ id: 1, educationType: "UG", grade: "8.4", maxGrade: "10", gradingType: "CGPA", marksheet: "https://x/m.pdf" }], resumeUrl: "https://x/r.pdf" } },
    { section: "IDENTITY", state: "SUBMITTED", submitted: { aadhaarNumber: "********1234", aadhaarDocument: "https://x/a.pdf" } },
  ] };
  getVerificationStudent.mockResolvedValue({ data: detail });
  verifySection.mockResolvedValue({ data: {} });
  sendBackSection.mockResolvedValue({ data: {} });

  render(<VerificationWorkspace canChangeSetting />);
  expect(await screen.findByText("Asha")).toBeInTheDocument();
  expect(screen.getByText("Waiting (1)")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("switch", { name: "The placement cell can verify profiles" }));
  await waitFor(() => expect(saveVerificationSettings).toHaveBeenCalledWith(null, false));

  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  expect(await screen.findByText("********1234")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Verify education/ }));
  // It sends the submission it showed, so a newer one sent meanwhile is not verified blind.
  await waitFor(() => expect(verifySection).toHaveBeenCalledWith(null, 77, "EDUCATION", "2026-10-04T09:00:00"));
  // The section buttons stay disabled while the verify call and the refresh after it run; a click before then does nothing.
  await waitFor(() => expect(screen.getAllByRole("button", { name: /Send back/ })[1]).toBeEnabled());
  fireEvent.click(screen.getAllByRole("button", { name: /Send back/ })[1]);
  const dialog = await screen.findByRole("dialog", { name: /Send Identity back/ }, { timeout: 5000 });
  fireEvent.click(within(dialog).getByRole("button", { name: "The document does not match the number" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Send back" }));
  await waitFor(() => expect(sendBackSection).toHaveBeenCalledWith(null, 77, "IDENTITY", "The document does not match the number"));
});

test("someone who may not verify sees why", async () => {
  getVerificationAccess.mockResolvedValue({ data: { canVerify: false, reason: "Your college admin has not allowed the placement cell to verify profiles" } });
  render(<VerificationWorkspace />);
  expect(await screen.findByText("Your college admin has not allowed the placement cell to verify profiles")).toBeInTheDocument();
});

// College admin audit CA-H03: a queue at the server's limit says so instead of looking complete.
test("a queue at the server limit warns that only the first 1,000 are shown", async () => {
  getVerificationAccess.mockResolvedValue({ data: { canVerify: true, collegeId: 6, counts: { SUBMITTED: 1200, UPDATE_PENDING: 0, SENT_BACK: 0, VERIFIED: 0 } } });
  getVerificationSettings.mockResolvedValue({ data: { tpoCanVerify: true } });
  getVerificationQueue.mockResolvedValue({ data: Array.from({ length: 1000 }, (_, i) => ({
    learnerId: 5000 + i, section: "EDUCATION", status: "SUBMITTED", firstName: `S${i}`, rollNumber: `R${i}`, branch: "CSE", submittedAt: "2026-10-04T09:00:00",
  })) });

  render(<VerificationWorkspace />);

  expect(await screen.findByTestId("verification.capped")).toHaveTextContent("Showing the first 1,000 students in this view");
});

test("a queue under the limit shows no cap warning", async () => {
  getVerificationAccess.mockResolvedValue({ data: { canVerify: true, collegeId: 6, counts: { SUBMITTED: 1, UPDATE_PENDING: 0, SENT_BACK: 0, VERIFIED: 0 } } });
  getVerificationSettings.mockResolvedValue({ data: { tpoCanVerify: true } });
  getVerificationQueue.mockResolvedValue({ data: [{ learnerId: 77, section: "EDUCATION", status: "SUBMITTED", firstName: "Asha", rollNumber: "R1", branch: "CSE", submittedAt: "2026-10-04T09:00:00" }] });

  render(<VerificationWorkspace />);

  expect(await screen.findByText("Asha")).toBeInTheDocument();
  expect(screen.queryByTestId("verification.capped")).not.toBeInTheDocument();
});
