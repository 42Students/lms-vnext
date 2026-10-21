import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mentor audit M-45/M-46/M-58: with Projects switched off the projects API refuses every call (module guard), so the
// page must not depend on it: course and college notifications still show, and the projects API is not called.
let mockFlags = { projectsEnabled: false, modules: { projects: false }, loading: false, failed: false };
jest.mock("@/utils/useCollegeFeatureFlags", () => () => mockFlags);
jest.mock("react-redux", () => ({ useSelector: (select) => select({ loginUser: { id: 23, collegeId: 7, deptId: 3 } }) }));
jest.mock("next/link", () => function MockLink({ children }) { return <a href="#">{children}</a>; });
jest.mock("@/components/Course/Common/CourseSectionHeader", () => function MockHeader() { return <div />; });
jest.mock("@/api/Services/projectService", () => ({
  getProjects: jest.fn(),
  extractProjectsPayload: (r) => r,
  normalizeProjectsList: (l) => l || [],
}));
jest.mock("@/api/Services/UserServices", () => ({ getNotificationsForRecipient: jest.fn() }));
jest.mock("@/api/Services/notificationService", () => ({ fetchAllTypesAnnouncement: jest.fn() }));

const { getProjects } = require("@/api/Services/projectService");
const { getNotificationsForRecipient } = require("@/api/Services/UserServices");
const { fetchAllTypesAnnouncement } = require("@/api/Services/notificationService");
const MentorNotificationsPage = require("@/pages/mentor/notifications").default;

beforeEach(() => {
  jest.clearAllMocks();
  fetchAllTypesAnnouncement.mockResolvedValue({ records: [{ id: 1, title: "Exam timetable published", message: "See the notice board" }], totalRecords: 1 });
  getNotificationsForRecipient.mockResolvedValue({ data: [] });
  // What the backend really answers when the module is off.
  getProjects.mockRejectedValue(Object.assign(new Error("Request failed with status code 403"), { response: { status: 403, data: { code: "FEATURE_DISABLED" } } }));
});

test("Projects off: the projects API is not called and college notifications still show", async () => {
  mockFlags = { projectsEnabled: false, modules: { projects: false }, loading: false, failed: false };
  render(<MentorNotificationsPage />);

  expect(await screen.findByText("Exam timetable published")).toBeInTheDocument();
  expect(getProjects).not.toHaveBeenCalled();
  expect(screen.queryByText(/couldn't load your notifications/i)).not.toBeInTheDocument();
});

test("Projects on but its call fails: the rest of the page still shows, with that source named as missing", async () => {
  mockFlags = { projectsEnabled: true, modules: { projects: true }, loading: false, failed: false };
  render(<MentorNotificationsPage />);

  expect(await screen.findByText("Exam timetable published")).toBeInTheDocument();
  expect(getProjects).toHaveBeenCalled();
  expect(screen.getByText(/project reviews and meetings/)).toBeInTheDocument();
});
