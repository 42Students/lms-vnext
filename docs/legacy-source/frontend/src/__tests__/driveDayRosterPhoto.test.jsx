/**
 * Student V1 §"Drive day" roster card (spec: "name, roll, photo and room"). Proves a student
 * with a photoUrl shows it as their avatar, and one without falls back to the generic user icon
 * instead of a broken image.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DriveDay from "@/pages/tpo/drive-day/[roundId]";
import { getRoster, markAttendance } from "@/api/Services/TpoHubService";

const mockRouter = { query: { roundId: "501" } };
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/api/Services/TpoHubService", () => ({ getRoster: jest.fn(), markAttendance: jest.fn() }));
jest.mock("@/api/Services/TpoService", () => ({ stageResult: jest.fn() }));

const roster = {
  counts: { WAITING: 0, PRESENT: 1, IN_INTERVIEW: 0, DONE: 0, ABSENT: 1 },
  students: [
    { applicationId: 993101, learnerId: 993001, firstName: "Asha", lastName: "R", rollNumber: "R001", branch: "CSE", attendance: "PRESENT", photoUrl: "https://cdn.example/photos/993001.jpg" },
    { applicationId: 993102, learnerId: 993002, firstName: "Bala", lastName: "S", rollNumber: "R002", branch: "ECE", attendance: "ABSENT", photoUrl: null },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  getRoster.mockResolvedValue({ data: roster });
});

test("shows the student's photo when available and a fallback icon when not", async () => {
  render(<DriveDay />);

  await screen.findByText(/Asha/);
  const images = document.querySelectorAll(".ant-avatar-image, img.ant-avatar-image, .ant-avatar img");
  // Asha has a photo: her avatar renders as an <img>. Bala has none: falls back to the icon avatar.
  const ashaCard = screen.getByText(/Asha/).closest(".ant-card");
  const balaCard = screen.getByText(/Bala/).closest(".ant-card");
  expect(ashaCard.querySelector("img")).toBeTruthy();
  expect(ashaCard.querySelector("img").src).toBe("https://cdn.example/photos/993001.jpg");
  expect(balaCard.querySelector("img")).toBeFalsy();
  expect(balaCard.querySelector(".anticon-user")).toBeTruthy();
});


test("the roster status strip filters the roster (no control-room hero)", async () => {
  render(<DriveDay />);

  expect(await screen.findByLabelText("Roster status")).toBeInTheDocument();
  expect(screen.queryByText("Live placement control room")).not.toBeInTheDocument();
  expect(screen.getByText("LIVE")).toBeInTheDocument();

  fireEvent.click(screen.getByText("absent").closest("button"));
  expect(screen.queryByText(/Asha/)).not.toBeInTheDocument();
  expect(screen.getByText(/Bala/)).toBeInTheDocument();
});

describe("field mode", () => {
  const fieldRoster = {
    counts: {},
    students: [
      { applicationId: 1, learnerId: 11, firstName: "Asha", lastName: "R", rollNumber: "21CS001", phone: "9000000001", attendance: "WAITING", assignedRoom: "Panel A" },
      { applicationId: 2, learnerId: 12, firstName: "Bala", lastName: "S", rollNumber: "21CS002", phone: "9000000002", attendance: "PRESENT", assignedRoom: "Panel A" },
      { applicationId: 3, learnerId: 13, firstName: "Chitra", lastName: "T", rollNumber: "21EC007", phone: "9000000003", attendance: "WAITING" },
    ],
  };
  beforeEach(() => {
    getRoster.mockResolvedValue({ data: fieldRoster });
    markAttendance.mockResolvedValue({ data: { status: "success", data: {} } });
  });

  test("typing a roll number and pressing Enter marks that student present", async () => {
    render(<DriveDay />);
    const box = await screen.findByLabelText("Roll number to mark present");
    fireEvent.change(box, { target: { value: "21cs001" } });
    fireEvent.keyDown(box, { key: "Enter", code: "Enter", charCode: 13 });
    await waitFor(() => expect(markAttendance).toHaveBeenCalledWith("501", { applicationId: 1, status: "PRESENT", room: undefined }));
    expect(await screen.findByText(/Asha R \(21CS001\) marked present\./)).toBeInTheDocument();
  });

  test("a short unique ending works, an unknown roll number is refused and nothing is saved", async () => {
    render(<DriveDay />);
    const box = await screen.findByLabelText("Roll number to mark present");
    fireEvent.change(box, { target: { value: "007" } });
    fireEvent.keyDown(box, { key: "Enter", code: "Enter", charCode: 13 });
    await waitFor(() => expect(markAttendance).toHaveBeenCalledWith("501", expect.objectContaining({ applicationId: 3, status: "PRESENT" })));
    markAttendance.mockClear();
    fireEvent.change(box, { target: { value: "99ZZ999" } });
    fireEvent.keyDown(box, { key: "Enter", code: "Enter", charCode: 13 });
    expect(await screen.findByText(/No student with roll number "99ZZ999" is on this roster\./)).toBeInTheDocument();
    expect(markAttendance).not.toHaveBeenCalled();
  });

  test("Call next puts the next checked-in student for that panel into interview", async () => {
    render(<DriveDay />);
    fireEvent.click(await screen.findByRole("button", { name: /Call next for Panel A/ }));
    await waitFor(() => expect(markAttendance).toHaveBeenCalledWith("501", { applicationId: 2, status: "IN_INTERVIEW", room: "Panel A" }));
    expect(await screen.findByText(/Panel A: Bala S \(21CS002\) called in\./)).toBeInTheDocument();
  });
});


test("completed rounds are review-only and do not expose working mutation controls", async () => {
  getRoster.mockResolvedValue({
    data: {
      round: { status: "COMPLETED", company: "Acme", name: "Technical" },
      counts: {},
      students: [
        { applicationId: 7, learnerId: 17, firstName: "Done", lastName: "Student", rollNumber: "R007", phone: "9000000007", attendance: "WAITING" },
      ],
    },
  });
  markAttendance.mockClear();

  render(<DriveDay />);

  expect(await screen.findByText("This round is complete. Attendance and result changes are locked.")).toBeInTheDocument();
  expect(screen.getByLabelText("Roll number to mark present")).toBeDisabled();
  expect(screen.getByRole("button", { name: /Present$/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Absent$/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /Present$/ }));
  expect(markAttendance).not.toHaveBeenCalled();
});

test("an actually empty roster is not described as a failed search", async () => {
  getRoster.mockResolvedValue({
    data: { round: { status: "SCHEDULED", company: "Acme", name: "Technical" }, counts: {}, students: [] },
  });

  render(<DriveDay />);

  expect(await screen.findByText("No students are on this round's roster.")).toBeInTheDocument();
  expect(screen.queryByText("No student matches your search.")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Roll number to mark present")).not.toBeInTheDocument();
});
